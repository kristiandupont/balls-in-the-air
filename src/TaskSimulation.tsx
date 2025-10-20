import type { Context } from "@b9g/crank";
import * as d3 from "d3";
import type { Ball } from "./storage";
import { calculateRadius, getBallColors, calculateTextSize } from "./storage";

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

// Individual ball circle component with enter/exit animations
function* BallCircle(
  this: Context,
  {
    ball,
    isSelected,
  }: {
    ball: Ball;
    isSelected: boolean;
  }
) {
  let prevAttrs = getCircleAttrs(ball, isSelected);

  // Enter animation
  this.schedule(async (g: SVGGElement) => {
    const targetR = getCircleAttrs(ball, isSelected).r;
    const circles = g.querySelectorAll('circle');
    circles.forEach(circle => {
      circle.style.transition = "none";
      circle.setAttribute("r", "0");
    });
    void g.getBoundingClientRect(); // force reflow
    circles.forEach((circle, i) => {
      circle.style.transition = "r 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)";
      if (i === 0) {
        // Outer border circle
        circle.setAttribute("r", String(targetR));
      } else if (i === 1) {
        // Moon base circle (95% of radius)
        circle.setAttribute("r", String(targetR * 0.95));
      } else {
        // Inner white circle (92% of radius)
        circle.setAttribute("r", String(targetR * 0.92));
      }
    });
  });

  // Exit animation
  this.cleanup(async (g: SVGGElement) => {
    const circles = g.querySelectorAll('circle');
    circles.forEach(circle => {
      circle.style.transition = "r 300ms ease-out, opacity 300ms ease-out";
      circle.setAttribute("r", "0");
      (circle as SVGCircleElement).style.opacity = "0";
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  for ({ ball, isSelected } of this) {
    const attrs = getCircleAttrs(ball, isSelected);
    const radius = attrs.r;
    const colors = getBallColors(ball, isSelected);

    // Fixed angle of 45 degrees for now (we can make this dynamic later)
    const offsetAngle = 45 * (Math.PI / 180); // Convert to radians
    const offsetDistance = radius * 0.03; // 3% offset
    const offsetX = Math.cos(offsetAngle) * offsetDistance;
    const offsetY = Math.sin(offsetAngle) * offsetDistance;

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
          style="filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5)); transition: r 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55), stroke 200ms ease-out, stroke-width 200ms ease-out;"
        />
        {/* Moon base circle - same hue as border, slightly darker */}
        <circle
          r={radius * 0.95}
          fill={colors.stroke}
          opacity="0.15"
          style="transition: r 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);"
        />
        {/* Inner white circle - offset to create crescent effect */}
        <circle
          cx={offsetX}
          cy={offsetY}
          r={radius * 0.92}
          fill="white"
          style="transition: r 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);"
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
    text.style.transition = "opacity 300ms ease-out";
    text.style.opacity = "1";
  });

  // Exit animation
  this.cleanup(async (text: SVGTextElement) => {
    text.style.transition = "opacity 300ms ease-out";
    text.style.opacity = "0";
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  for ({ ball, isSelected } of this) {
    const attrs = getTextAttrs(ball, isSelected);

    yield (
      <text
        text-anchor="middle"
        dominant-baseline="central"
        clip-path={`url(#clip-${ball.id})`}
        style={`pointer-events: none; fill: ${attrs.fill}; font-weight: ${attrs.fontWeight}; font-size: ${attrs.fontSize}; transition: fill 200ms ease-out, font-size 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);`}
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
  }: {
    ball: Ball;
    isSelected: boolean;
    onRegister: (ball: Ball, el: SVGGElement) => void;
  }
) {
  for ({ ball, isSelected, onRegister } of this) {
    yield (
      <g
        class="ball"
        style="cursor: grab;"
        transform={`translate(${ball.x || 0},${ball.y || 0})`}
        ref={(el: SVGGElement | null) => {
          if (el) {
            onRegister(ball, el);
          }
        }}
      >
        <clipPath id={`clip-${ball.id}`}>
          <circle r={calculateRadius(ball)} />
        </clipPath>
        <BallCircle ball={ball} isSelected={isSelected} />
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

  // Initialize ball positions
  balls.forEach((ball) => {
    if (ball.x === undefined || ball.y === undefined) {
      ball.x = width / 2 + (Math.random() - 0.5) * 100;
      ball.y = height / 2 + (Math.random() - 0.5) * 100;
      ball.vx = (Math.random() - 0.5) * 2;
      ball.vy = (Math.random() - 0.5) * 2;
    }
  });

  const tick = () => {
    // Update positions imperatively to avoid re-renders
    balls.forEach((ball) => {
      const el = ballElements.get(ball.id);
      if (el && ball.x !== undefined && ball.y !== undefined) {
        el.setAttribute("transform", `translate(${ball.x},${ball.y})`);
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

  // Cleanup
  this.cleanup(() => {
    if (forceSimulation) {
      forceSimulation.stop();
    }
  });

  for ({
    balls,
    width,
    height,
    onBallClick,
    onBallDragStart,
    onBallDragEnd,
    selectedBall,
  } of this) {
    // Recreate force simulation when balls change
    if (forceSimulation) {
      forceSimulation.stop();
    }

    forceSimulation = d3
      .forceSimulation(balls)
      .force(
        "collision",
        d3.forceCollide<Ball>().radius((d) => calculateRadius(d) + 2)
      )
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("charge", d3.forceManyBody<Ball>().strength(-30))
      .force("boundary", () => {
        const padding = 10;
        const nodes = forceSimulation!.nodes();
        nodes.forEach((ball) => {
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
      .alphaDecay(0.001)
      .velocityDecay(0.8)
      .on("tick", tick);

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
          />
        ))}
      </svg>
    );
  }
}

// Export the main simulation component
export { TaskSimulation };
