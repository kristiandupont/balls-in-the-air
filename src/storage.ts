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
const MIN_BALL_RADIUS = 20;
const DEFAULT_HUE = 210;
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

export function calculateRadius(ball: Ball): number {
  const daysSinceBump = (Date.now() - ball.lastBumped) / MILLISECONDS_PER_DAY;
  return MIN_BALL_RADIUS + daysSinceBump * ball.growthRate;
}

export function getBallColors(ball: Ball, isSelected: boolean = false) {
  const hue = ball.hue ?? DEFAULT_HUE;

  if (isSelected) {
    // Darker version when selected
    return {
      fill: `hsl(${hue}, 75%, 65%)`, // Main color
      stroke: `hsl(${hue}, 75%, 45%)`, // Darker stroke
      text: `hsl(${hue}, 75%, 95%)`, // Lighter text
    };
  }

  return {
    fill: `hsl(${hue}, 75%, 50%)`, // Darker fill
    stroke: `hsl(${hue}, 75%, 30%)`, // Even darker stroke
    text: `hsl(${hue}, 75%, 85%)`, // Keep text light
  };
}

export function calculateTextSize(ball: Ball): number {
  const radius = calculateRadius(ball);
  const lines = ball.name.split("\n");
  const lineCount = lines.length;
  const longestLine = Math.max(...lines.map((line) => line.length), 1);

  // Base size: proportion of radius
  let baseSize = radius * 0.35;

  // Adjust for text length - longer text needs smaller font
  // Assume ~0.6 * fontSize per character width
  const estimatedTextWidth = longestLine * 0.6;
  const availableWidth = radius * 1.6; // Ball diameter minus some padding
  if (estimatedTextWidth > availableWidth / baseSize) {
    baseSize = availableWidth / estimatedTextWidth;
  }

  // Adjust for line count - more lines need smaller font
  const lineHeight = 1.2;
  const totalTextHeight = lineCount * lineHeight;
  const availableHeight = radius * 1.6; // Ball diameter minus some padding
  if (totalTextHeight > availableHeight / baseSize) {
    baseSize = availableHeight / totalTextHeight;
  }

  // Apply user's text scale preference
  const textScale = ball.textScale ?? 1.0;
  const finalSize = baseSize * textScale;

  // Minimum size for readability
  return Math.max(2, finalSize);
}
