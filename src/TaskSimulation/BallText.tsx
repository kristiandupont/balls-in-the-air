import type { Context } from "@b9g/crank";
import { type Ball } from "../storage";
import { calculateRadius } from "./calculateRadius";
import { getBallColors } from "./getBallColors";
import { formatRelativeTimeShort } from "../formatRelativeTime";
import { ANIMATION_DURATIONS, BALL_TEXT_CONFIG } from "./config";

const LINE_HEIGHT = 1.2;

function calculateTextSize(ball: Ball): number {
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
  const totalTextHeight = lineCount * LINE_HEIGHT;
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

export const getTextAttrs = (d: Ball, isSelected: boolean) => ({
  fill: getBallColors(d, isSelected).text,
  fontSize: `${calculateTextSize(d)}px`,
  fontWeight: "600",
});

export function showsAgeLabel(ball: Ball): boolean {
  return (
    calculateRadius(ball) >= BALL_TEXT_CONFIG.AGE_LABEL_MIN_RADIUS &&
    // A ball bumped within the last hour reads "just now", which is noise
    Date.now() - ball.lastBumped >= 1000 * 60 * 60
  );
}

export function renderBallText(ball: Ball) {
  const fontSize = calculateTextSize(ball);
  const lines = ball.name.split("\n");
  const lineHeightPx = fontSize * LINE_HEIGHT;

  const withAge = showsAgeLabel(ball);
  const ageSize = Math.max(
    BALL_TEXT_CONFIG.AGE_LABEL_MIN_SIZE,
    fontSize * BALL_TEXT_CONFIG.AGE_LABEL_SCALE,
  );
  const ageOffset = ageSize * 1.8;

  // Center the name lines and the age label together as one block
  const blockHeight =
    (lines.length - 1) * lineHeightPx + (withAge ? ageOffset : 0);
  const startY = -blockHeight / 2;

  const nameLines = lines.map((line, i) => (
    <tspan x={0} y={startY + i * lineHeightPx}>
      {line}
    </tspan>
  ));

  if (!withAge) {
    return nameLines;
  }

  return [
    ...nameLines,
    <tspan
      x={0}
      y={startY + (lines.length - 1) * lineHeightPx + ageOffset}
      style={`font-size: ${ageSize}px; font-weight: 400; opacity: ${BALL_TEXT_CONFIG.AGE_LABEL_OPACITY};`}
    >
      {formatRelativeTimeShort(ball.lastBumped)}
    </tspan>,
  ];
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
        {renderBallText(ball)}
      </text>
    );
  }
}
