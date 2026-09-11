import {
  type Ball,
  MILLISECONDS_PER_DAY,
  MIN_BALL_RADIUS,
  MAX_BALL_RADIUS,
  TARGET_BALL_RADIUS,
} from "../storage";

// A ball starts at MIN_BALL_RADIUS and grows linearly, reaching
// TARGET_BALL_RADIUS when its frequency has elapsed since the last bump.
export function calculateRadius(ball: Ball): number {
  const daysSinceBump = (Date.now() - ball.lastBumped) / MILLISECONDS_PER_DAY;
  const progress = daysSinceBump / ball.frequencyDays;
  return Math.min(
    MIN_BALL_RADIUS + progress * (TARGET_BALL_RADIUS - MIN_BALL_RADIUS),
    MAX_BALL_RADIUS,
  );
}
