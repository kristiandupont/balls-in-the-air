import type { Context } from "@b9g/crank";
import * as d3 from "d3";
import type { Ball } from "./storage";
import { calculateRadius, getBallColors, calculateTextSize } from "./storage";

// Visual constants
const CRESCENT_CONFIG = {
  MOON_BASE_SCALE: 0.95,
  INNER_CIRCLE_SCALE: 0.92,
  OFFSET_DISTANCE: 0.03,
  MOON_OPACITY: 0.15,
  INITIAL_ANGLE_DEG: 45,
} as const;

const ANIMATION_DURATIONS = {
  ENTER_EXIT: 300,
  RADIUS_TRANSITION: 300,
  COLOR_TRANSITION: 200,
} as const;

const SIMULATION_CONFIG = {
  COLLISION_PADDING: 2,
  CENTER_STRENGTH: 0.05,
  CHARGE_STRENGTH: -30,
  BOUNDARY_PADDING: 10,
  ALPHA_DECAY: 0.001,
  VELOCITY_DECAY: 0.8,
  CRESCENT_MIN_DISTANCE: 0.1,
  CRESCENT_SPEED_FACTOR: 0.02,
  CRESCENT_MAX_SPEED: 0.3,
} as const;

// Centralized visual properties
const getCircleAttrs = (d: Ball, isSelected: boolean) => ({
  r: calculateRadius(d),
  fill: "white",
  stroke: getBallColors(d, isSelected).stroke,
  strokeWidth: isSelected ? 6 : 4,
});

const getTextAttrs = (d: Ball, isSelected: boolean) => ({
  fill: getBallColors(d, isSelected).text,
  fontSize: `${calculateTextSize(d)}px`,
  fontWeight: "600",
});

function renderMultiLineText(ball: Ball) {
  const lines = ball.name.split("\n");
  const lineHeight = 1.2;
  const startY = (-(lines.length - 1) * lineHeight) / 2;

  return lines.map((line, i) => (
    <tspan x={0} y={`${startY + i * lineHeight}em`}>
      {line}
    </tspan>
  ));
}

// Helper to update crescent angle based on position change
function updateCrescentAngle(
  crescentData: { angle: number; prevX: number; prevY: number },
  currentX: number,
  currentY: number
): void {
  const dx = currentX - crescentData.prevX;
  const dy = currentY - crescentData.prevY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > SIMULATION_CONFIG.CRESCENT_MIN_DISTANCE) {
    const targetAngle = Math.atan2(dy, dx);
    const transitionSpeed = Math.min(
      distance * SIMULATION_CONFIG.CRESCENT_SPEED_FACTOR,
      SIMULATION_CONFIG.CRESCENT_MAX_SPEED
    );

    // Handle angle wrapping (shortest path between angles)
    let angleDiff = targetAngle - crescentData.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    crescentData.angle += angleDiff * transitionSpeed;
  }

  crescentData.prevX = currentX;
  crescentData.prevY = currentY;
}

// Helper to create force simulation
function createForceSimulation(
  balls: Ball[],
  width: number,
  height: number,
  tickFn: () => void
): d3.Simulation<Ball, undefined> {
  return d3
    .forceSimulation(balls)
    .force(
      "collision",
      d3.forceCollide<Ball>().radius((d) => calculateRadius(d) + SIMULATION_CONFIG.COLLISION_PADDING)
    )
    .force("x", d3.forceX(width / 2).strength(SIMULATION_CONFIG.CENTER_STRENGTH))
    .force("y", d3.forceY(height / 2).strength(SIMULATION_CONFIG.CENTER_STRENGTH))
    .force("charge", d3.forceManyBody<Ball>().strength(SIMULATION_CONFIG.CHARGE_STRENGTH))
    .force("boundary", () => {
      const padding = SIMULATION_CONFIG.BOUNDARY_PADDING;
      balls.forEach((ball) => {
        const r = calculateRadius(ball);
        if (ball.x! < r + padding) {
          ball.x = r + padding;
          ball.vx = Math.abs(ball.vx || 0) * 0.5;
        }
        if (ball.x! > width - r - padding) {
          ball.x = width - r - padding;
          ball.vx = -Math.abs(ball.vx || 0) * 0.5;
        }
        if (ball.y! < r + padding) {
          ball.y = r + padding;
          ball.vy = Math.abs(ball.vy || 0) * 0.5;
        }
        if (ball.y! > height - r - padding) {
          ball.y = height - r - padding;
          ball.vy = -Math.abs(ball.vy || 0) * 0.5;
        }
      });
    })
    .alpha(1)
    .alphaDecay(SIMULATION_CONFIG.ALPHA_DECAY)
    .velocityDecay(SIMULATION_CONFIG.VELOCITY_DECAY)
    .on("tick", tickFn);
}

// Individual ball circle component with enter/exit animations
function* BallCircle(
  this: Context,
  {
    ball,
    isSelected,
    onRegisterCrescent,
  }: {
    ball: Ball;
    isSelected: boolean;
    onRegisterCrescent: (ball: Ball, el: SVGCircleElement) => void;
  }
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
      circle.style.transition =
        `r ${ANIMATION_DURATIONS.RADIUS_TRANSITION}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
      if (i === 0) {
        // Outer border circle
        circle.setAttribute("r", String(targetR));
      } else if (i === 1) {
        // Moon base circle
        circle.setAttribute("r", String(targetR * CRESCENT_CONFIG.MOON_BASE_SCALE));
      } else {
        // Inner white circle
        circle.setAttribute("r", String(targetR * CRESCENT_CONFIG.INNER_CIRCLE_SCALE));
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
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATIONS.ENTER_EXIT));
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

// Individual ball text component
function* BallText(
  this: Context,
  {
    ball,
    isSelected,
  }: {
    ball: Ball;
    isSelected: boolean;
  }
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
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATIONS.ENTER_EXIT));
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

// Individual ball group component
function* BallGroup(
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
  }
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
        <BallCircle ball={ball} isSelected={isSelected} onRegisterCrescent={onRegisterCrescent} />
        <BallText ball={ball} isSelected={isSelected} />
      </g>
    );
  }
}

export interface ChartRenderer {
  container: HTMLDivElement;
  updateSelection: (selectedBall: Ball | null) => void;
  updateBalls: (balls: Ball[], selectedBall?: Ball | null) => void;
  destroy: () => void;
}

// Main simulation component
function* TaskSimulation(
  this: Context,
  {
    balls,
    width,
    height,
    onBallClick,
    onBallDragStart,
    onBallDragEnd,
    selectedBall,
  }: {
    balls: Ball[];
    width: number;
    height: number;
    onBallClick: (ballId: string | null) => void;
    onBallDragStart?: () => void;
    onBallDragEnd?: () => void;
    selectedBall: Ball | null;
  }
) {
  let forceSimulation: d3.Simulation<Ball, undefined> | null = null;
  const ballElements = new Map<string, SVGGElement>();
  let isDragging = false;
  let dragDistance = 0;
  let dragStartTime = 0;
  let justClickedBall = false;

  // Track crescent angles for each ball
  const crescentAngles = new Map<string, { angle: number; prevX: number; prevY: number }>();

  // Helper to initialize a ball's position and crescent angle
  const initializeBall = (ball: Ball) => {
    if (ball.x === undefined || ball.y === undefined) {
      ball.x = width / 2 + (Math.random() - 0.5) * 100;
      ball.y = height / 2 + (Math.random() - 0.5) * 100;
      ball.vx = (Math.random() - 0.5) * 2;
      ball.vy = (Math.random() - 0.5) * 2;
    }
    if (!crescentAngles.has(ball.id)) {
      crescentAngles.set(ball.id, {
        angle: CRESCENT_CONFIG.INITIAL_ANGLE_DEG * (Math.PI / 180),
        prevX: ball.x || 0,
        prevY: ball.y || 0,
      });
    }
  };

  // Initialize ball positions and crescent angles
  balls.forEach(initializeBall);

  const crescentElements = new Map<string, SVGCircleElement>();

  const tick = () => {
    // Update positions and crescent angles imperatively
    balls.forEach((ball) => {
      // Update position
      const el = ballElements.get(ball.id);
      if (el && ball.x !== undefined && ball.y !== undefined) {
        el.setAttribute("transform", `translate(${ball.x},${ball.y})`);
      }

      // Update crescent angle
      const crescentData = crescentAngles.get(ball.id);
      const crescentEl = crescentElements.get(ball.id);

      if (crescentData && crescentEl) {
        const currentX = ball.x || 0;
        const currentY = ball.y || 0;

        updateCrescentAngle(crescentData, currentX, currentY);

        // Update crescent position
        const radius = calculateRadius(ball);
        const offsetDistance = radius * CRESCENT_CONFIG.OFFSET_DISTANCE;
        const offsetX = Math.cos(crescentData.angle) * offsetDistance;
        const offsetY = Math.sin(crescentData.angle) * offsetDistance;

        crescentEl.setAttribute("cx", String(offsetX));
        crescentEl.setAttribute("cy", String(offsetY));
      }
    });
  };

  // Drag behavior
  const drag = d3
    .drag<SVGGElement, Ball>()
    .on("start", function (_event, d) {
      isDragging = false;
      dragDistance = 0;
      dragStartTime = Date.now();
      if (forceSimulation) {
        forceSimulation.alphaTarget(0).alpha(0.05);
      }
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", function (event, d) {
      dragDistance += Math.abs(event.dx) + Math.abs(event.dy);
      if (dragDistance > 5) {
        if (!isDragging) {
          isDragging = true;
          if (onBallDragStart) onBallDragStart();
          if (forceSimulation) {
            forceSimulation.alphaTarget(0.3).restart();
          }
        }
        d.fx = event.x;
        d.fy = event.y;
      }
    })
    .on("end", function (_event, d) {
      const clickDuration = Date.now() - dragStartTime;

      if (isDragging) {
        if (onBallDragEnd) onBallDragEnd();
        if (forceSimulation) {
          forceSimulation.alphaTarget(0);
        }
        d.fx = undefined;
        d.fy = undefined;
        isDragging = false;
      } else {
        d.fx = undefined;
        d.fy = undefined;
        if (forceSimulation) {
          forceSimulation.alphaTarget(0).alpha(0.3).restart();
        }

        if (clickDuration < 300) {
          justClickedBall = true;
          onBallClick(d.id);
          setTimeout(() => {
            justClickedBall = false;
          }, 10);
        }
      }
      dragDistance = 0;
    });

  const handleBallRegister = (ball: Ball, el: SVGGElement) => {
    ballElements.set(ball.id, el);
    // Attach drag behavior - need to type select properly
    d3.select<SVGGElement, Ball>(el).datum(ball).call(drag);
  };

  const handleCrescentRegister = (ball: Ball, el: SVGCircleElement) => {
    crescentElements.set(ball.id, el);
  };

  // Cleanup
  this.cleanup(() => {
    if (forceSimulation) {
      forceSimulation.stop();
    }
  });

  // Track previous values to detect when we need to recreate simulation
  let prevBalls = balls;
  let prevWidth = width;
  let prevHeight = height;

  // Create initial force simulation
  forceSimulation = createForceSimulation(balls, width, height, tick);

  for ({
    balls,
    width,
    height,
    onBallClick,
    onBallDragStart,
    onBallDragEnd,
    selectedBall,
  } of this) {
    // Sync crescent angles with current balls
    const currentBallIds = new Set(balls.map(b => b.id));

    // Add new balls
    balls.forEach(initializeBall);

    // Remove balls that no longer exist
    for (const ballId of crescentAngles.keys()) {
      if (!currentBallIds.has(ballId)) {
        crescentAngles.delete(ballId);
      }
    }

    // Recreate force simulation only when balls array or dimensions change
    if (balls !== prevBalls || width !== prevWidth || height !== prevHeight) {
      if (forceSimulation) {
        forceSimulation.stop();
      }

      forceSimulation = createForceSimulation(balls, width, height, tick);

      prevBalls = balls;
      prevWidth = width;
      prevHeight = height;
    }

    yield (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style="width: 100%; height: 100%; font: 14px sans-serif;"
        onclick={() => {
          if (!justClickedBall) {
            onBallClick(null);
          }
        }}
      >
        {balls.map((ball) => (
          <BallGroup
            key={ball.id}
            ball={ball}
            isSelected={ball === selectedBall}
            onRegister={handleBallRegister}
            onRegisterCrescent={handleCrescentRegister}
          />
        ))}
      </svg>
    );
  }
}

// Export the main simulation component
export { TaskSimulation };
