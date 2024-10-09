import type { DebugValueString, ErrorOptions } from "arcscord";
import { BaseError } from "arcscord";

export type OpenAiErrorOptions = ErrorOptions & {
  model: string;
  send: string;
  receive: string;
  usedTokens: {
    send: number;
    receive: number;
    total: number;
  };
};

export class OpenAIError extends BaseError {
  model: string;

  send: string;

  receive: string;

  usedTokens: {
    send: number;
    receive: number;
    total: number;
  };

  constructor(options: OpenAiErrorOptions) {
    super(options);

    this.model = options.model;
    this.send = options.send;
    this.receive = options.receive;
    this.usedTokens = options.usedTokens;

    this.name = "OpenAIError";
  }

  getDebugsString(): DebugValueString[] {
    const debugs: DebugValueString[] = [];
    debugs.push(...super.getDebugsString());

    debugs.push(["Model", this.model]);
    debugs.push(["Send", this.send]);
    debugs.push(["Receive", this.receive]);
    debugs.push(["Used Tokens", JSON.stringify(this.usedTokens)]);

    return debugs;
  }
}
