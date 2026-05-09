import * as THREE from "three";
import { DEFAULT_TIME_WARP, R_EARTH } from "./bodies";
import type { ManeuverInput, SimulationState } from "./bodies";
import { rotateHeadingTowardTargetInPlane } from "./launch-guidance";

const PITCH_HOLD_ALTITUDE_METERS = 12_000;
const PITCH_BLEND_END_ALTITUDE_METERS = 140_000;
const MANUAL_TURN_RATE_WARP_NORMALIZER = DEFAULT_TIME_WARP;
const MANUAL_TURN_RATE_MULTIPLIER = 5;
const PROGRAMMED_TARGET_DIRECTION = new THREE.Vector3();
const RADIAL_DIRECTION = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export type HeadingControlResult = {
  heading: THREE.Vector3;
  autopilotActive: boolean;
};

type ResolveRocketHeadingOptions = {
  state: SimulationState;
  input: ManeuverInput;
  turnRateDeg: number;
  timeStepSeconds: number;
  controlTimeWarp: number;
};

export function resolveRocketHeading({
  state,
  input,
  turnRateDeg,
  timeStepSeconds,
  controlTimeWarp,
}: ResolveRocketHeadingOptions): HeadingControlResult {
  const autopilotActive = !state.guidanceComplete;
  const elapsedControlSeconds = getElapsedControlSeconds(
    timeStepSeconds,
    controlTimeWarp,
  );

  if (autopilotActive) {
    return {
      heading: rotateHeadingTowardProgrammedTarget(
        state.rocket.heading,
        state.rocket.position,
        state.targetDirection,
        turnRateDeg * timeStepSeconds,
      ),
      autopilotActive,
    };
  }

  return {
    heading: rotateHeadingFromManualInput(
      state.rocket.heading,
      input.turn,
      elapsedControlSeconds,
      turnRateDeg,
    ),
    autopilotActive,
  };
}

function getElapsedControlSeconds(
  timeStepSeconds: number,
  controlTimeWarp: number,
) {
  return Number.isFinite(controlTimeWarp) && controlTimeWarp > 0
    ? timeStepSeconds / controlTimeWarp
    : timeStepSeconds;
}

function rotateHeadingTowardProgrammedTarget(
  heading: THREE.Vector3,
  position: THREE.Vector3,
  targetDirection: THREE.Vector3,
  maxTurnDeg: number,
) {
  return rotateHeadingTowardTargetInPlane(
    heading,
    getProgrammedTargetDirection(position, targetDirection),
    maxTurnDeg,
  );
}

function rotateHeadingFromManualInput(
  heading: THREE.Vector3,
  turn: ManeuverInput["turn"],
  elapsedControlSeconds: number,
  turnRateDeg: number,
): THREE.Vector3 {
  const planarHeading = heading.clone().setY(0);
  if (planarHeading.lengthSq() <= 1e-9) {
    planarHeading.set(1, 0, 0);
  } else {
    planarHeading.normalize();
  }

  if (turn === 0) {
    return planarHeading;
  }

  return planarHeading
    .applyAxisAngle(
      WORLD_UP,
      THREE.MathUtils.degToRad(
        turn *
          turnRateDeg *
          MANUAL_TURN_RATE_WARP_NORMALIZER *
          MANUAL_TURN_RATE_MULTIPLIER *
          elapsedControlSeconds,
      ),
    )
    .normalize();
}

function getProgrammedTargetDirection(
  position: THREE.Vector3,
  targetDirection: THREE.Vector3,
): THREE.Vector3 {
  const blend = THREE.MathUtils.smoothstep(
    altitudeAboveEarth(position),
    PITCH_HOLD_ALTITUDE_METERS,
    PITCH_BLEND_END_ALTITUDE_METERS,
  );

  RADIAL_DIRECTION.copy(position).normalize();
  return PROGRAMMED_TARGET_DIRECTION
    .copy(RADIAL_DIRECTION)
    .lerp(targetDirection, blend)
    .normalize();
}

function altitudeAboveEarth(position: THREE.Vector3) {
  return position.length() - R_EARTH;
}
