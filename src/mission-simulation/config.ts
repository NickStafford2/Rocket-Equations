import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
} from "../physics/bodies";
import { ROCKET_PHYSICAL_MODEL_SPECS } from "../rocket/definitions";

export {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
};

export function createSimulationConfig({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
}: {
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  dt: number;
}) {
  return {
    launchSpeed,
    launchAngleDeg,
    launchAzimuthDeg,
    launchAltitudeMeters:
      ROCKET_PHYSICAL_MODEL_SPECS["saturn-v"].surfaceContactOffsetMeters,
    dt,
    thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
    turnRateDeg: DEFAULT_TURN_RATE_DEG,
  };
}
