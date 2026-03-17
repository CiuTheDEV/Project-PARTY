// games/kalambury/src/host/components/play-utils.ts

export function formatKalamburyTimerValue(seconds: number): string {
  return Math.max(0, Math.trunc(seconds)).toString();
}

export const confettiPieces = [
  { x: "8%", y: "6%", delay: "0s", rotate: "-18deg", type: "emoji" },
  { x: "13%", y: "18%", delay: "0.2s", rotate: "14deg", type: "emoji" },
  { x: "22%", y: "30%", delay: "0.35s", rotate: "-30deg", type: "confetti" },
  { x: "34%", y: "12%", delay: "0.1s", rotate: "22deg", type: "confetti" },
  { x: "41%", y: "24%", delay: "0.45s", rotate: "-12deg", type: "confetti" },
  { x: "58%", y: "10%", delay: "0.18s", rotate: "28deg", type: "confetti" },
  { x: "66%", y: "20%", delay: "0.5s", rotate: "-8deg", type: "emoji" },
  { x: "74%", y: "14%", delay: "0.25s", rotate: "20deg", type: "confetti" },
  { x: "84%", y: "8%", delay: "0.4s", rotate: "-26deg", type: "emoji" },
  { x: "90%", y: "28%", delay: "0.55s", rotate: "16deg", type: "confetti" },
  { x: "10%", y: "78%", delay: "0.15s", rotate: "12deg", type: "emoji" },
  { x: "18%", y: "88%", delay: "0.6s", rotate: "-14deg", type: "confetti" },
  { x: "30%", y: "82%", delay: "0.32s", rotate: "18deg", type: "confetti" },
  { x: "48%", y: "90%", delay: "0.48s", rotate: "-20deg", type: "confetti" },
  { x: "66%", y: "84%", delay: "0.22s", rotate: "10deg", type: "emoji" },
  { x: "78%", y: "92%", delay: "0.58s", rotate: "-10deg", type: "confetti" },
  { x: "90%", y: "86%", delay: "0.3s", rotate: "26deg", type: "emoji" },
] as const;
