import type { Result } from "arcscord";
import type { VideoInfo } from "./youtube.type";
import { youtube } from "@googleapis/youtube";
import { anyToError, BaseError, error, ok } from "arcscord";
import { env } from "../../env/env.util";

const client = youtube({
  version: "v3",
  auth: env.GOOGLE_API_KEY,
});

export async function youtubeSearch(term: string): Promise<Result<VideoInfo[], BaseError>> {
  try {
    const request = await client.search.list({
      channelId: "UC5HDIVwuqoIuKKw-WbQ4CvA",
      maxResults: 5,
      part: ["id", "snippet"],
      q: term,
      type: ["video"],
    });
    const list = request.data.items || [];
    return ok(list.map((l) => {
      const info: VideoInfo = {
        url: `https://www.youtube.com/watch?v=${l.id?.videoId}`,
        id: l.id?.videoId || "no_id",
        title: l.snippet?.title || "no_title",
        media: l.snippet?.thumbnails?.high?.url || undefined,
      };
      return info;
    }));
  }
  catch (e) {
    return error(new BaseError({
      message: "failed to request youtube error",
      baseError: anyToError(e),
    }));
  }
}
