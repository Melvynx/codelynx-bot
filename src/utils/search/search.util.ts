import type { Result } from "arcscord";
import type { ChatCompletionMessageParam } from "openai/resources";
import type { PostInfos, SearchResult } from "./search.type";
import { anyToError, ArcLogger, BaseError, error, ok } from "arcscord";
import OpenAI from "openai";
import { OpenAIError } from "../error/openai_error.class";
import { generateId } from "../id/id.util";
import { prisma } from "../prisma/prisma.util";
import { cleanPrompt } from "./search.const";
import { searchX } from "./x/x.util";
import { youtubeSearch } from "./youtube/youtube.util";

const openAIClient = new OpenAI();

const results = new Map<string, SearchResult>();

export const searchLog = new ArcLogger("search");

export async function cleanSearch(text: string): Promise<Result<string, BaseError>> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: cleanPrompt,
    },
    {
      role: "user",
      content: text,
    },
  ];
  try {
    const response = await openAIClient.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const clean = response.choices[0]?.message.content;
    if (!clean) {
      return error(new OpenAIError({
        message: "get nul content",
        model: response.model,
        send: JSON.stringify(messages),
        receive: "",
        usedTokens: {
          send: response.usage?.prompt_tokens || 0,
          receive: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      }));
    }

    try {
      await prisma.xPrompt.create({
        data: {
          id: generateId(),
          type: "CLEAN",
          send: JSON.stringify(messages),
          result: clean,
          sendTokenUsed: response.usage?.prompt_tokens || 0,
          receiveTokenUsed: response.usage?.completion_tokens || 0,
          version: 0,
        },
      });
    }
    catch (err) {
      searchLog.error("failed update db for search clean", [anyToError(err).message]);
    }
    return ok(clean);
  }
  catch (err) {
    return error(new BaseError({
      message: "failed to clean search",
      baseError: anyToError(err),
    }));
  }
}

export async function search(searchTerm: string, cleanSearchingTerm = false): Promise<Result<SearchResult, BaseError>> {
  if (cleanSearchingTerm) {
    const [clean, err] = await cleanSearch(searchTerm);
    if (err) {
      return error(err);
    }
    searchTerm = clean;
  }
  const [ids, err] = await searchX(searchTerm);
  if (err) {
    return error(err);
  }

  const threads = await prisma.xSubject.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      Thread: true,
      InitalPost: true,
    },
  });

  const cleanThreads: PostInfos[] = [];
  for (const id of ids) {
    const thread = threads.find(thread => thread.id === id);
    if (!thread) {
      continue;
    }

    cleanThreads.push({
      title: thread.title,
      url: thread.InitalPost.url,
    });
  }
  const [video, err2] = await youtubeSearch(searchTerm);
  if (err2) {
    return error(err2);
  }

  const result: SearchResult = {
    youtubeVideos: video,
    xPosts: cleanThreads,
    id: generateId(),
    query: searchTerm,
  };

  results.set(result.id, result);

  return ok(result);
}

export function getResults(id: string): SearchResult | undefined {
  return results.get(id);
}
