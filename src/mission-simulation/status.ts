import { formatDt } from "../mission";

export const INITIAL_MISSION_STATUS =
  "Rocket staged on Earth's surface. Use the arrow keys to fly, Space to start or pause, R to restart, and WASD to change delta t.";

export const RESTAGED_STATUS = "Rocket restaged with updated launch conditions.";

export const RESET_STATUS = "Rocket reset to Earth's surface.";

export const PAUSED_STATUS = "Paused.";

export function createRunningStatus(dt: number): string {
  return `Running. Use Left and Right to steer, Up to burn, Space to pause, R to restart, and WASD to adjust delta t (${formatDt(dt)} s).`;
}
