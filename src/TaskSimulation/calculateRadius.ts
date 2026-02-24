import {
  Ball,
  MILLISECONDS_PER_DAY,
  MIN_BALL_RADIUS,
  MAX_BALL_RADIUS,
} from "./storage";

export function calculateRadius(ball: Ball): number {
  const daysSinceBump = (Date.now() - ball.lastBumped) / MILLISECONDS_PER_DAY;
  return Math.min(
    MIN_BALL_RADIUS + daysSinceBump * ball.growthRate,
    MAX_BALL_RADIUS,
  );
}
