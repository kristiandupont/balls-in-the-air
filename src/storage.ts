export interface Ball {
  id: string;
  name: string;
  lastBumped: number; // timestamp
  growthRate: number; // pixels per day
  x?: number; // position for force simulation
  y?: number;
  vx?: number; // velocity
  vy?: number;
  fx?: number | null; // fixed position during drag
  fy?: number | null;
}

const STORAGE_KEY = "balls-data";

const DEFAULT_BALLS: Ball[] = [
  {
    id: "1",
    name: "Clean coffee grinder",
    lastBumped: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    growthRate: 2, // grows 2px per day, so ~60px in 30 days
  },
  {
    id: "2",
    name: "Water plants",
    lastBumped: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    growthRate: 5, // grows faster - weekly task
  },
  {
    id: "3",
    name: "Review finances",
    lastBumped: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
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

export function calculateRadius(ball: Ball): number {
  const daysSinceBump = (Date.now() - ball.lastBumped) / (1000 * 60 * 60 * 24);
  const minRadius = 20;
  const result = minRadius + daysSinceBump * ball.growthRate;
  return result;
}
