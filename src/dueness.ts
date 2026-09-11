import { MILLISECONDS_PER_DAY, type Ball } from "./storage";

// Time at which the ball's frequency has elapsed since the last bump
export function dueTime(ball: Ball): number {
  return ball.lastBumped + ball.frequencyDays * MILLISECONDS_PER_DAY;
}

// 0 at the last bump, 1 when the ball is due, above 1 when overdue
export function dueProgress(ball: Ball): number {
  return (
    (Date.now() - ball.lastBumped) / (ball.frequencyDays * MILLISECONDS_PER_DAY)
  );
}

export function isOverdue(ball: Ball): boolean {
  return Date.now() > dueTime(ball);
}

// Positive when overdue, negative while the ball still has time left
export function overdueBy(ball: Ball): number {
  return Date.now() - dueTime(ball);
}
