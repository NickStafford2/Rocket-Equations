import { formatTimeWarp } from "../mission";

export const INITIAL_MISSION_STATUS =
  "Rocket staged on Earth's surface. Space starts atmospheric autopilot, then manual flight resumes after atmosphere exit. R restarts, and WASD changes time warp.";

export const RESTAGED_STATUS =
  "Rocket restaged with updated launch conditions.";

export const RESET_STATUS = "Rocket reset to Earth's surface.";

export const PAUSED_STATUS = "Paused.";

export function createRunningStatus(timeWarp: number): string {
  return `Running. Autopilot handles atmospheric ascent. After atmosphere exit, Left and Right steer, Up burns, Space pauses, R restarts, and WASD adjusts time warp (${formatTimeWarp(timeWarp)}x).`;
}
