import type { VideoInfo } from "./youtube/youtube.type";

export type SearchResult = {
  youtubeVideos: VideoInfo[];
  xPosts: PostInfos[];
  id: string;
  query: string;
};

export type PostInfos = {
  title: string;
  url: string;
};
