export enum PlayerStates {
  BUFFERING = 3,
  ENDED = 0,
  PAUSED = 2,
  PLAYING = 1,
  UNSTARTED = -1,
  VIDEO_CUED = 5,
}

export type CustomEvent = {
  target: YouTubePlayer;
  data: any;
};

export type EventType = 'ready' | 'stateChange' | 'playbackQualityChange' | 'playbackRateChange' | 'error' | 'apiChange' | 'volumeChange';

export type YouTubePlayer = {
  addEventListener(event: string, listener: (event: CustomEvent) => void): void;
  destroy(): void;
  getAvailablePlaybackRates(): ReadonlyArray<number>;
  getAvailableQualityLevels(): ReadonlyArray<string>;
  getCurrentTime(): number;
  getDuration(): number;
  getIframe(): HTMLIFrameElement;
  getOption(module: string, option: string): any;
  getOptions(): string[];
  getOptions(module: string): object;
  setOption(module: string, option: string, value: any): void;
  setOptions(): void;
  cuePlaylist(playlist: string | ReadonlyArray<string>, index?: number, startSeconds?: number, suggestedQuality?: string): void;
  cuePlaylist(playlist: {
    listType: string;
    list?: string | undefined;
    index?: number | undefined;
    startSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadPlaylist(playlist: string | ReadonlyArray<string>, index?: number, startSeconds?: number, suggestedQuality?: string): void;
  loadPlaylist(playlist: {
    listType: string;
    list?: string | undefined;
    index?: number | undefined;
    startSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  getPlaylist(): ReadonlyArray<string>;
  getPlaylistIndex(): number;
  getPlaybackQuality(): string;
  getPlaybackRate(): number;
  getPlayerState(): PlayerStates;
  getVideoEmbedCode(): string;
  getVideoLoadedFraction(): number;
  getVideoUrl(): string;
  getVolume(): number;
  cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  cueVideoById(video: {
    videoId: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  cueVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
  cueVideoByUrl(video: {
    mediaContentUrl: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadVideoByUrl(mediaContentUrl: string, startSeconds?: number, suggestedQuality?: string): void;
  loadVideoByUrl(video: {
    mediaContentUrl: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  loadVideoById(video: {
    videoId: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  isMuted(): boolean;
  mute(): void;
  nextVideo(): void;
  pauseVideo(): void;
  playVideo(): void;
  playVideoAt(index: number): void;
  previousVideo(): void;
  removeEventListener(event: string, listener: (event: CustomEvent) => void): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setLoop(loopPlaylists: boolean): void;
  setPlaybackQuality(suggestedQuality: string): void;
  setPlaybackRate(suggestedRate: number): void;
  setShuffle(shufflePlaylist: boolean): void;
  setSize(width: number, height: number): object;
  setVolume(volume: number): void;
  stopVideo(): void;
  unMute(): void;
  on(eventType: 'stateChange', listener: (event: CustomEvent & { data: number }) => void): void;
  on(eventType: EventType, listener: (event: CustomEvent) => void): void;
};
