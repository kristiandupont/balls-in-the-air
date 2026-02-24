import type { Context } from "@b9g/crank";
import { type Ball, calculateRadius, getBallColors } from "../storage";
import { ANIMATION_DURATIONS, CRESCENT_CONFIG } from "./config";

export const getCircleAttrs = (d: Ball, isSelected: boolean) => ({
  r: calculateRadius(d),
  fill: "white",
  stroke: getBallColors(d, isSelected).stroke,
  strokeWidth: isSelected ? 6 : 4,
});

// Individual ball circle component with enter/exit animations
export function* BallCircle(
  this: Context,
  {
    ball,
    isSelected,
    onRegisterCrescent,
  }: {
    ball: Ball;
    isSelected: boolean;
    onRegisterCrescent: (ball: Ball, el: SVGCircleElement) => void;
  },
) {
  let prevAttrs = getCircleAttrs(ball, isSelected);

  // Enter animation
  this.schedule(async (g: SVGGElement) => {
    const targetR = getCircleAttrs(ball, isSelected).r;
    const circles = g.querySelectorAll("circle");
    circles.forEach((circle) => {
      circle.style.transition = "none";
      circle.setAttribute("r", "0");
    });
    void g.getBoundingClientRect(); // force reflow
    circles.forEach((circle, i) => {
      circle.style.transition = `r ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
      if (i === 0) {
        // Outer border circle
        circle.setAttribute("r", String(targetR));
      } else if (i === 1) {
        // Moon base circle
        circle.setAttribute(
          "r",
          String(targetR * CRESCENT_CONFIG.MOON_BASE_SCALE),
        );
      } else {
        // Inner white circle
        circle.setAttribute(
          "r",
          String(targetR * CRESCENT_CONFIG.INNER_CIRCLE_SCALE),
        );
      }
    });
  });

  // Exit animation
  this.cleanup(async (g: SVGGElement) => {
    const circles = g.querySelectorAll("circle");
    circles.forEach((circle) => {
      circle.style.transition = `r ${ANIMATION_DURATIONS.ENTER_EXIT}ms ease-out, opacity ${ANIMATION_DURATIONS.ENTER_EXIT}ms ease-out`;
      circle.setAttribute("r", "0");
      (circle as SVGCircleElement).style.opacity = "0";
    });
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_DURATIONS.ENTER_EXIT),
    );
  });

  for ({ ball, isSelected, onRegisterCrescent } of this) {
    const attrs = getCircleAttrs(ball, isSelected);
    const radius = attrs.r;
    const colors = getBallColors(ball, isSelected);

    // Initial offset (will be updated imperatively in tick)
    const offsetDistance = radius * CRESCENT_CONFIG.OFFSET_DISTANCE;
    const initialAngle = CRESCENT_CONFIG.INITIAL_ANGLE_DEG * (Math.PI / 180);
    const offsetX = Math.cos(initialAngle) * offsetDistance;
    const offsetY = Math.sin(initialAngle) * offsetDistance;

    // Handle updates with transitions
    if (
      attrs.r !== prevAttrs.r ||
      attrs.stroke !== prevAttrs.stroke ||
      attrs.strokeWidth !== prevAttrs.strokeWidth
    ) {
      // Transition will be handled by CSS
      prevAttrs = attrs;
    }

    yield (
      <g>
        {/* Outer border circle */}
        <circle
          r={radius}
          fill="white"
          stroke={attrs.stroke}
          stroke-width={attrs.strokeWidth}
          style={`filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5)); transition: r ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55), stroke ${ANIMATION_DURATIONS.COLOR_TRANSITION}ms ease-out, stroke-width ${ANIMATION_DURATIONS.COLOR_TRANSITION}ms ease-out;`}
        />
        {/* Moon base circle - same hue as border, slightly darker */}
        <circle
          r={radius * CRESCENT_CONFIG.MOON_BASE_SCALE}
          fill={colors.stroke}
          opacity={CRESCENT_CONFIG.MOON_OPACITY}
          style={`transition: r ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55);`}
        />
        {/* Inner white circle - offset to create crescent effect */}
        <circle
          cx={offsetX}
          cy={offsetY}
          r={radius * CRESCENT_CONFIG.INNER_CIRCLE_SCALE}
          fill="white"
          style={`transition: r ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55);`}
          ref={(el: SVGCircleElement | null) => {
            if (el) {
              onRegisterCrescent(ball, el);
            }
          }}
        />
      </g>
    );
  }
}
