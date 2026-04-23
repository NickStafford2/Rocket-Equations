import * as THREE from "three";
import type { ImpactState } from "./physics/bodies";
import { SOFT_LANDING_SPEED } from "./physics/bodies";

const MIN_DT = 0.1;
const MAX_DT = 1000;

export type CameraPreset = "overview" | "earth" | "moon" | "sun" | "rocket";
export type CameraTarget = Exclude<CameraPreset, "overview">;

export function formatDistance(meters: number): string {
  const clamped = Math.max(meters, 0);

  if (clamped >= 1_000_000_000) {
    return `${(clamped / 1_000_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} million km`;
  }

  return `${(clamped / 1000).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} km`;
}

export function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(2)} km/s`;
  }

  return `${speed.toFixed(0)} m/s`;
}

export function formatRelativeSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(3)} km/s`;
  }

  return `${speed.toFixed(1)} m/s`;
}

export function formatElapsed(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = hours - days * 24;

  if (days === 0) {
    return `${remainingHours.toFixed(1)} hr`;
  }

  return `${days} d ${remainingHours.toFixed(1)} hr`;
}

export function formatDt(dt: number): string {
  if (dt >= 100) return dt.toFixed(0);
  if (dt >= 10) return dt.toFixed(1);
  return dt.toFixed(2);
}

export function clampDt(dt: number): number {
  return THREE.MathUtils.clamp(dt, MIN_DT, MAX_DT);
}

export function getMissionPhase(
  altitudeEarth: number,
  altitudeMoon: number,
  relativeMoonSpeed: number,
): string {
  const safeAltitudeEarth = Math.max(altitudeEarth, 0);
  const safeAltitudeMoon = Math.max(altitudeMoon, 0);

  if (safeAltitudeMoon < 15_000 && relativeMoonSpeed < 250)
    return "Landing burn";
  if (safeAltitudeMoon < 80_000) return "Lunar approach";
  if (safeAltitudeEarth < 80_000) return "Surface departure";
  if (safeAltitudeEarth < 40_000_000) return "Earth escape arc";

  return "Translunar coast";
}

export function describeMoonLanding(impact: ImpactState): string {
  if (impact.softLanding) {
    return `Soft lunar landing at ${formatRelativeSpeed(impact.relativeSpeed)} relative speed.`;
  }

  return `Hard lunar impact at ${formatRelativeSpeed(impact.relativeSpeed)} relative speed. Target is ${formatRelativeSpeed(
    SOFT_LANDING_SPEED,
  )} or less.`;
}

export function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;

  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON"
  );
}

export function normalizeFocusLabelToPreset(
  label: unknown,
): CameraPreset | null {
  const normalized = String(label).toLowerCase();

  if (
    normalized === "overview" ||
    normalized === "earth" ||
    normalized === "moon" ||
    normalized === "sun" ||
    normalized === "rocket"
  ) {
    return normalized;
  }

  return null;
}
