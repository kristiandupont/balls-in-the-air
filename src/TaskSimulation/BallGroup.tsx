import type { Context } from "@b9g/crank";
import { type Ball, calculateRadius } from "../storage";
import { BallText } from "./BallText";
import { BallCircle } from "./BallCircle";

// Individual ball group component
export function* BallGroup(
  this: Context,
  {
    ball,
    isSelected,
    onRegister,
    onRegisterCrescent,
  }: {
    ball: Ball;
    isSelected: boolean;
    onRegister: (ball: Ball, el: SVGGElement) => void;
    onRegisterCrescent: (ball: Ball, el: SVGCircleElement) => void;
  },
) {
  // Track if this is the first render for the ref callback
  let isFirstRender = true;

  for ({ ball, isSelected, onRegister, onRegisterCrescent } of this) {
    const shouldCallRegister = isFirstRender;
    isFirstRender = false;

    yield (
      <g
        class="ball"
        style="cursor: grab;"
        transform={`translate(${ball.x || 0},${ball.y || 0})`}
        ref={(el: SVGGElement | null) => {
          if (el && shouldCallRegister) {
            onRegister(ball, el);
          }
        }}
      >
        <clipPath id={`clip-${ball.id}`}>
          <circle r={calculateRadius(ball)} />
        </clipPath>
        <BallCircle
          ball={ball}
          isSelected={isSelected}
          onRegisterCrescent={onRegisterCrescent}
        />
        <BallText ball={ball} isSelected={isSelected} />
      </g>
    );
  }
}
