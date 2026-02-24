import { SIMULATION_CONFIG } from "./config";

// Helper to update crescent angle based on position change
export function updateCrescentAngle(
  crescentData: { angle: number; prevX: number; prevY: number },
  currentX: number,
  currentY: number,
): void {
  const dx = currentX - crescentData.prevX;
  const dy = currentY - crescentData.prevY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > SIMULATION_CONFIG.CRESCENT_MIN_DISTANCE) {
    const targetAngle = Math.atan2(dy, dx);
    const transitionSpeed = Math.min(
      distance * SIMULATION_CONFIG.CRESCENT_SPEED_FACTOR,
      SIMULATION_CONFIG.CRESCENT_MAX_SPEED,
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
