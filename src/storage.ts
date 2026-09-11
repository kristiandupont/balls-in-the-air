export interface Ball {
  id: string;
  name: string;
  lastBumped: number; // timestamp
  frequencyDays: number; // days until the ball reaches TARGET_BALL_RADIUS
  hue?: number; // 0-360, defaults to 210 (blue)
  textScale?: number; // 0.5-2.0, multiplier for auto-calculated text size
  x?: number; // position for force simulation
  y?: number;
  vx?: number; // velocity
  vy?: number;
  fx?: number | null; // fixed position during drag
  fy?: number | null;
}

// Shape of balls stored before frequencyDays replaced growthRate
type StoredBall = Ball & { growthRate?: number };

const STORAGE_KEY = "balls-data";
export const MIN_BALL_RADIUS = 20;
export const MAX_BALL_RADIUS = 200;
// Radius a ball has reached when its frequency has elapsed
export const TARGET_BALL_RADIUS = 150;
export const DEFAULT_FREQUENCY_DAYS = 30;
export const DEFAULT_HUE = 210;
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const DEFAULT_BALLS: Ball[] = [
  {
    id: "1",
    name: "Clean coffee grinder",
    lastBumped: Date.now() - 15 * MILLISECONDS_PER_DAY, // 15 days ago
    frequencyDays: 60,
  },
  {
    id: "2",
    name: "Water plants",
    lastBumped: Date.now() - 5 * MILLISECONDS_PER_DAY, // 5 days ago
    frequencyDays: 7,
  },
  {
    id: "3",
    name: "Review finances",
    lastBumped: Date.now() - 20 * MILLISECONDS_PER_DAY, // 20 days ago
    frequencyDays: 30,
  },
];

// Converts px/day growth into the number of days needed to reach
// TARGET_BALL_RADIUS, so migrated balls keep the size they have today.
export function growthRateToFrequencyDays(growthRate: number): number {
  return (TARGET_BALL_RADIUS - MIN_BALL_RADIUS) / growthRate;
}

function migrateBall(ball: StoredBall): Ball {
  const { growthRate, ...rest } = ball;

  let frequencyDays = rest.frequencyDays;
  if (
    typeof frequencyDays !== "number" ||
    !isFinite(frequencyDays) ||
    frequencyDays <= 0
  ) {
    frequencyDays =
      typeof growthRate === "number" && isFinite(growthRate) && growthRate > 0
        ? growthRateToFrequencyDays(growthRate)
        : DEFAULT_FREQUENCY_DAYS;
  }

  return { ...rest, frequencyDays };
}

export function loadBalls(): Ball[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return (JSON.parse(stored) as StoredBall[]).map(migrateBall);
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
