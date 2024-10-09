import type { DebugValues, DebugValueString } from "arcscord";
import type { Logger } from "ts-log";
import { logEmbedBuilder } from "@/components/log_embed/logEmbed.builder";
import { defaultLogger } from "arcscord";
import { sendLog } from "./log.util";

export class LynxLogger implements Logger {
  [x: string]: any;
  trace(message: any, ..._optionalParams: any[]): void {
    defaultLogger.trace(message);
  }

  debug(message: string | DebugValueString): void {
    defaultLogger.debug(message);
  }

  info(message: string): void {
    sendLog({
      embeds: [logEmbedBuilder({ logLevel: "info", message })],
    });
    defaultLogger.info(message);
  }

  warn(message: string): void {
    sendLog({
      embeds: [logEmbedBuilder({ logLevel: "warn", message })],
    });
    defaultLogger.warning(message);
  }

  error(
    message: string,
    debugs?: (string | DebugValueString)[] | DebugValues,
  ): void {
    sendLog({
      embeds: [logEmbedBuilder({ logLevel: "error", message })],
    });
    defaultLogger.error(message, debugs);
  }
}
