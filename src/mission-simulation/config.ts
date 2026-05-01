import {
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
} from "../physics/bodies";
import { ROCKET_PHYSICAL_MODEL_SPECS } from "../rocket/definitions";

export function createSimulationConfig({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  timeWarp: timeWarp,
}: {
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  timeWarp: number;
}) {
  return {
    launchSpeed,
    launchAngleDeg,
    launchAzimuthDeg,
    launchAltitudeMeters:
      ROCKET_PHYSICAL_MODEL_SPECS["saturn-v"].surfaceContactOffsetMeters,
    timeWarp: timeWarp,
    thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
    turnRateDeg: DEFAULT_TURN_RATE_DEG,
  };
}
