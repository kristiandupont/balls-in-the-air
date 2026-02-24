import type { Context } from "@b9g/crank";
import * as d3 from "d3";
import type { Ball } from "../storage";
import { calculateRadius } from "./calculateRadius";
import { createForceSimulation } from "./createForceSimulation";
import { CRESCENT_CONFIG } from "./config";
import { updateCrescentAngle } from "./updateCrescentAngle";
import { BallGroup } from "./BallGroup";

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
  },
) {
  let forceSimulation: d3.Simulation<Ball, undefined> | null = null;
  const ballElements = new Map<string, SVGGElement>();
  let isDragging = false;
  let dragDistance = 0;
  let dragStartTime = 0;
  let justClickedBall = false;

  // Track crescent angles for each ball
  const crescentAngles = new Map<
    string,
    { angle: number; prevX: number; prevY: number }
  >();

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
    const currentBallIds = new Set(balls.map((b) => b.id));

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
