import * as d3 from "d3";
import { type Ball } from "../storage";
import { calculateRadius } from "./calculateRadius";
import { SIMULATION_CONFIG } from "./config";

// Helper to create force simulation
export function createForceSimulation(
  balls: Ball[],
  width: number,
  height: number,
  tickFn: () => void,
): d3.Simulation<Ball, undefined> {
  return d3
    .forceSimulation(balls)
    .force(
      "collision",
      d3
        .forceCollide<Ball>()
        .radius(
          (d) => calculateRadius(d) + SIMULATION_CONFIG.COLLISION_PADDING,
        ),
    )
    .force(
      "x",
      d3.forceX(width / 2).strength(SIMULATION_CONFIG.CENTER_STRENGTH),
    )
    .force(
      "y",
      d3.forceY(height / 2).strength(SIMULATION_CONFIG.CENTER_STRENGTH),
    )
    .force(
      "charge",
      d3.forceManyBody<Ball>().strength(SIMULATION_CONFIG.CHARGE_STRENGTH),
    )
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
