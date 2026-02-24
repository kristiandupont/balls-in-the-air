export interface Ball {
  id: string;
  name: string;
  lastBumped: number; // timestamp
  growthRate: number; // pixels per day
  hue?: number; // 0-360, defaults to 210 (blue)
  textScale?: number; // 0.5-2.0, multiplier for auto-calculated text size
  x?: number; // position for force simulation
  y?: number;
  vx?: number; // velocity
  vy?: number;
  fx?: number | null; // fixed position during drag
  fy?: number | null;
}

const STORAGE_KEY = "balls-data";
export const MIN_BALL_RADIUS = 20;
export const MAX_BALL_RADIUS = 200;
export const DEFAULT_HUE = 210;
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const DEFAULT_BALLS: Ball[] = [
  {
    id: "1",
    name: "Clean coffee grinder",
    lastBumped: Date.now() - 15 * MILLISECONDS_PER_DAY, // 15 days ago
    growthRate: 2, // grows 2px per day, so ~60px in 30 days
  },
  {
    id: "2",
    name: "Water plants",
    lastBumped: Date.now() - 5 * MILLISECONDS_PER_DAY, // 5 days ago
    growthRate: 5, // grows faster - weekly task
  },
  {
    id: "3",
    name: "Review finances",
    lastBumped: Date.now() - 20 * MILLISECONDS_PER_DAY, // 20 days ago
    growthRate: 1.5, // monthly task
  },
];

export function loadBalls(): Ball[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Ball[];
    }
  } catch (error) {
    console.error("Failed to load balls from localStorage:", error);
  }
  return DEFAULT_BALLS;
}

export function saveBalls(balls: Ball[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(balls));
  } catch (error) {
    console.error("Failed to save balls to localStorage:", error);
  }
}
