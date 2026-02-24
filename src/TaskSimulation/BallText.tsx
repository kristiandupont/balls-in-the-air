import type { Context } from "@b9g/crank";
import { calculateTextSize, getBallColors, type Ball } from "../storage";
import { ANIMATION_DURATIONS } from "./config";

export const getTextAttrs = (d: Ball, isSelected: boolean) => ({
  fill: getBallColors(d, isSelected).text,
  fontSize: `${calculateTextSize(d)}px`,
  fontWeight: "600",
});

export function renderMultiLineText(ball: Ball) {
  const lines = ball.name.split("\n");
  const lineHeight = 1.2;
  const startY = (-(lines.length - 1) * lineHeight) / 2;

  return lines.map((line, i) => (
    <tspan x={0} y={`${startY + i * lineHeight}em`}>
      {line}
    </tspan>
  ));
}

// Individual ball text component
export function* BallText(
  this: Context,
  {
    ball,
    isSelected,
  }: {
    ball: Ball;
    isSelected: boolean;
  },
) {
  // Enter animation
  this.schedule(async (text: SVGTextElement) => {
    text.style.transition = "none";
    text.style.opacity = "0";
    void text.getBoundingClientRect(); // force reflow
    text.style.transition = `opacity ${ANIMATION_DURATIONS.ENTER_EXIT}ms ease-out`;
    text.style.opacity = "1";
  });

  // Exit animation
  this.cleanup(async (text: SVGTextElement) => {
    text.style.transition = `opacity ${ANIMATION_DURATIONS.ENTER_EXIT}ms ease-out`;
    text.style.opacity = "0";
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_DURATIONS.ENTER_EXIT),
    );
  });

  for ({ ball, isSelected } of this) {
    const attrs = getTextAttrs(ball, isSelected);

    yield (
      <text
        text-anchor="middle"
        dominant-baseline="central"
        clip-path={`url(#clip-${ball.id})`}
        style={`pointer-events: none; fill: ${attrs.fill}; font-weight: ${attrs.fontWeight}; font-size: ${attrs.fontSize}; transition: fill ${ANIMATION_DURATIONS.COLOR_TRANSITION}ms ease-out, font-size ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55);`}
      >
        {renderMultiLineText(ball)}
      </text>
    );
  }
}
