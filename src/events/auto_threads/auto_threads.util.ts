import { defaultLogger } from "arcscord";

export function parseTitle(body: string, url: string): string {
  const match = body.match(/<title[^>]*>([^<]*)<\/title>/);
  if (!match || typeof match[1] !== "string") {
    defaultLogger.warning(`don't title found in ${url}`);
    return "no title found for website";
  }
  return match[1];
}
