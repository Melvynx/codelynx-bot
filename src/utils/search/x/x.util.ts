import type { Result } from "arcscord";
import type { ChatCompletionMessageParam } from "openai/resources";
import type { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/src/resources/chat/completions";
import { anyToError, defaultLogger, error, ok } from "arcscord";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OpenAIError } from "../../error/openai_error.class";
import { generateId } from "../../id/id.util";
import { prisma } from "../../prisma/prisma.util";
import { searchLog } from "../search.util";
import { search } from "./functions/search";
import { responseSchema, searchPrompt } from "./x.const";
import Chat = OpenAI.Chat;

const client = new OpenAI();

async function executeFunction(call: ChatCompletionMessageToolCall.Function): Promise<string> {
  const unsavedArgs = JSON.parse(call.arguments);
  switch (call.name) {
    case search.name: {
      const args = search.params.safeParse(unsavedArgs);
      if (!args.success) {
        return `{"error": "${args.error.message}"`;
      }
      return search.run(args.data);
    }

    default: {
      return "{\"error\":\"function don't exist\"}";
    }
  }
}

async function pushToDB(completion: Chat.ChatCompletion, messages: ChatCompletionMessageParam[]): Promise<void> {
  try {
    await prisma.xPrompt.create({
      data: {
        id: generateId(),
        version: 0,
        send: JSON.stringify(messages),
        result: JSON.stringify(completion.choices[0]?.message || {}),
        sendTokenUsed: completion.usage?.prompt_tokens || 0,
        receiveTokenUsed: completion.usage?.completion_tokens || 0,
        type: "SEARCH",
      },
    });
  }
  catch (e) {
    searchLog.error(`failed to create db : ${anyToError(e).message}`);
  }
}

export async function searchX(term: string): Promise<Result<string[], OpenAIError>> {
  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: search.name,
        description: search.description,
        parameters: zodToJsonSchema(search.params),
      },
    },
  ];

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: searchPrompt,
    },
    {
      role: "user",
      content: term,
    },
  ];

  let i = 0;
  while (i <= 6) {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      response_format: {
        type: "json_object",
      },
      tool_choice: i < 3 ? "auto" : "none",
      temperature: 0.2,
      top_p: 0.2,
    });

    const message = completion.choices[0]?.message;
    if (!message) {
      void pushToDB(completion, messages);
      return error(new OpenAIError({
        message: "get nul content",
        model: completion.model,
        send: JSON.stringify(messages),
        receive: "",
        usedTokens: {
          send: completion.usage?.prompt_tokens || 0,
          receive: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      }));
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);
      for (const toolCall of message.tool_calls) {
        const response = await executeFunction(toolCall.function);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: response,
        });
      }
      i++;
      continue;
    }

    let content = message.content;
    if (content === null) {
      void pushToDB(completion, messages);
      return error(new OpenAIError({
        message: "get null content",
        model: completion.model,
        send: JSON.stringify(messages),
        receive: JSON.stringify(message),
        usedTokens: {
          send: completion.usage?.prompt_tokens || 0,
          receive: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      }));
    }

    try {
      if (content.includes("}{")) {
        content = `${content.split("}{")[0]}}`;
      }
      if (content.includes("}\n{")) {
        content = `${content.split("}\n{")[0]}}`;
      }

      const data = responseSchema.parse(JSON.parse(content));

      if (!data.status) {
        void pushToDB(completion, messages);
        return error(new OpenAIError({
          message: `a error has occurred : ${data.error || ""}`,
          model: completion.model,
          send: JSON.stringify(messages),
          receive: JSON.stringify(message),
          usedTokens: {
            send: completion.usage?.prompt_tokens || 0,
            receive: completion.usage?.completion_tokens || 0,
            total: completion.usage?.total_tokens || 0,
          },
        }));
      }

      void pushToDB(completion, messages);
      return ok(data.ids);
    }
    catch (e) {
      void pushToDB(completion, messages);

      const err = new OpenAIError({
        message: `invalid response format for query ${term}, retry...`,
        model: completion.model,
        send: JSON.stringify(messages),
        receive: JSON.stringify(message),
        usedTokens: {
          send: completion.usage?.prompt_tokens || 0,
          receive: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
        baseError: anyToError(e),
      });
      defaultLogger.logError(err);
    }
    return searchX(term);
  }

  return ok([term]);
}
