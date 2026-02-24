import { type Ball, DEFAULT_HUE } from "../storage";

export function getBallColors(ball: Ball, isSelected: boolean = false) {
  const hue = ball.hue ?? DEFAULT_HUE;

  if (isSelected) {
    // Darker version when selected
    return {
      fill: `hsl(${hue}, 75%, 65%)`,
      stroke: `hsl(${hue}, 75%, 45%)`,
      text: `hsl(${hue}, 75%, 45%)`,
    };
  }

  return {
    fill: `hsl(${hue}, 75%, 50%)`,
    stroke: `hsl(${hue}, 75%, 30%)`,
    text: `hsl(${hue}, 75%, 35%)`,
  };
}
