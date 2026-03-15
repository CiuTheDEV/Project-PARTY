export type KalamburySymbolName =
  | "animation"
  | "chevron_left"
  | "chevron_right"
  | "database"
  | "info"
  | "logout"
  | "person"
  | "play_circle"
  | "settings"
  | "sports_esports"
  | "theater_comedy"
  | "timer"
  | "volume_up";

type KalamburySymbolIconProps = {
  className?: string;
  name: KalamburySymbolName;
};

const paths: Record<KalamburySymbolName, string> = {
  animation:
    "M4 12c2.4-3.4 5-5.1 8-5.1s5.6 1.7 8 5.1c-2.4 3.4-5 5.1-8 5.1S6.4 15.4 4 12Zm8-7.5 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 10.8 9.6 12l.5-2.6-1.9-1.8 2.6-.4L12 4.5Z",
  chevron_left: "M14.7 6.7 9.4 12l5.3 5.3-1.4 1.4L6.6 12l6.7-6.7 1.4 1.4Z",
  chevron_right: "m9.3 17.3 5.3-5.3-5.3-5.3 1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4Z",
  database:
    "M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 6v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.7 1.3-4.8 2-8 2s-6.3-.7-8-2Zm0 6v1c0 1.7 3.6 3 8 3s8-1.3 8-3v-1c-1.7 1.3-4.8 2-8 2s-6.3-.7-8-2Z",
  info: "M11 10h2v7h-2v-7Zm1-4.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2Z",
  logout:
    "M10 17v-2h4V9h-4V7h4q.8 0 1.4.6.6.6.6 1.4v6q0 .8-.6 1.4-.6.6-1.4.6h-4Zm-2-2-1.4-1.4 1.6-1.6H3v-2h5.2L6.6 8.4 8 7l4 4-4 4Z",
  person:
    "M12 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4Zm0 2c3.3 0 6 1.5 6 3.3V20H6v-2.7C6 15.5 8.7 14 12 14Z",
  play_circle:
    "M10 16.5 16 12l-6-4.5v9ZM12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2Z",
  settings:
    "m19.4 13 .2-1-.2-1 2.1-1.6-2-3.4-2.5 1a7.7 7.7 0 0 0-1.7-1l-.4-2.7h-4l-.4 2.7c-.6.2-1.2.6-1.7 1l-2.5-1-2 3.4L4.6 11a6.7 6.7 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1c.5.4 1.1.8 1.7 1l.4 2.7h4l.4-2.7c.6-.2 1.2-.6 1.7-1l2.5 1 2-3.4-2.1-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z",
  sports_esports:
    "M7 8 5 6 2.5 8.5 5 11l2-2h3v2H8v2h2v2h4v-2h2v-2h-2V9h3l2 2 2.5-2.5L19 6l-2 2H7Z",
  theater_comedy:
    "M4 4h7v8c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V4Zm9 5h7v6c0 1.7-1.3 3-3 3h-1c-1.7 0-3-1.3-3-3V9Zm-6 1c.5 0 1 .4 1 1s-.5 1-1 1-1-.4-1-1 .5-1 1-1Zm8 2c.5 0 1 .4 1 1s-.5 1-1 1-1-.4-1-1 .5-1 1-1ZM8.8 7.4a3 3 0 0 1-4 0l1.4-1.4c.3.3.9.3 1.2 0L8.8 7.4Zm7.6 5.4a3 3 0 0 1-4 0l1.4-1.4c.3.3.9.3 1.2 0l1.4 1.4Z",
  timer:
    "M9 2h6v2H9V2Zm3 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm1 2h-2v4l3.2 1.9 1-1.6-2.2-1.3V8Z",
  volume_up:
    "M5 9v6h4l5 4V5L9 9H5Zm11.5 3c0-1.8-1-3.3-2.5-4.1v8.2A4.7 4.7 0 0 0 16.5 12Zm0-7.3v2.1c2.9 1 5 3.8 5 7.2s-2.1 6.2-5 7.2v2.1c4.1-1 7-4.8 7-9.3s-2.9-8.3-7-9.3Z",
};

export function KalamburySymbolIcon({
  className,
  name,
}: KalamburySymbolIconProps) {
  return (
    <span className={className} aria-hidden="true">
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d={paths[name]} fill="currentColor" />
      </svg>
    </span>
  );
}
