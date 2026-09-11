import { type Ball, DEFAULT_HUE } from "../storage";
import { isOverdue } from "../dueness";

export function getBallColors(ball: Ball, isSelected: boolean = false) {
  const hue = ball.hue ?? DEFAULT_HUE;
  // An overdue ball is filled with a light tint of its own hue instead of
  // white, so it reads as "full" without losing the color it was given
  const surface = isOverdue(ball) ? `hsl(${hue}, 85%, 94%)` : "white";

  if (isSelected) {
    // Darker version when selected
    return {
      fill: `hsl(${hue}, 75%, 65%)`,
      stroke: `hsl(${hue}, 75%, 45%)`,
      text: `hsl(${hue}, 75%, 45%)`,
      surface,
    };
  }

  return {
    fill: `hsl(${hue}, 75%, 50%)`,
    stroke: `hsl(${hue}, 75%, 30%)`,
    text: `hsl(${hue}, 75%, 35%)`,
    surface,
  };
}
