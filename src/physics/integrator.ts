import * as THREE from "three";
import {
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
  MIN_NEAR_EARTH_ORBIT_SPEED_METERS_PER_SECOND,
  moonPositionMeters,
  moonVelocityMeters,
  R_EARTH,
  R_MOON,
  SOFT_LANDING_SPEED,
} from "./bodies";
import type { ManeuverInput } from "./bodies";
import type { SimulationState } from "./bodies";
import { gravitationalAccelerationMeters } from "./gravity";
import { rotateHeadingTowardTargetInPlane } from "./launch-guidance";

const GUIDANCE_ANGLE_TOLERANCE_DEG = 0.75;
const GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND = 10;
const PITCH_HOLD_ALTITUDE_METERS = 12_000;
const PITCH_BLEND_END_ALTITUDE_METERS = 140_000;
const PROGRAMMED_TARGET_DIRECTION = new THREE.Vector3();
const RADIAL_DIRECTION = new THREE.Vector3();

function rotateHeadingFromManualInput(
  heading: THREE.Vector3,
  turn: ManeuverInput["turn"],
  timeWarp: number,
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
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(turn * turnRateDeg * timeWarp),
    )
    .normalize();
}

function getProgrammedTargetDirection(
  position: THREE.Vector3,
  targetDirection: THREE.Vector3,
): THREE.Vector3 {
  const altitudeEarth = altitudeAboveEarth(position, R_EARTH);
  const blend = THREE.MathUtils.smoothstep(
    altitudeEarth,
    PITCH_HOLD_ALTITUDE_METERS,
    PITCH_BLEND_END_ALTITUDE_METERS,
  );

  RADIAL_DIRECTION.copy(position).normalize();
  return PROGRAMMED_TARGET_DIRECTION
    .copy(RADIAL_DIRECTION)
    .lerp(targetDirection, blend)
    .normalize();
}

export function stepSimulation(
  state: SimulationState,
  timeWarp: number,
  input: ManeuverInput,
  targetSpeed: number,
  thrustAcceleration: number = DEFAULT_THRUST_ACCELERATION,
  turnRateDeg: number = DEFAULT_TURN_RATE_DEG,
  surfaceContactOffsetMeters: number = 0,
): SimulationState {
  if (state.impact) return state;

  const requiredGuidanceSpeed = Math.max(
    targetSpeed,
    MIN_NEAR_EARTH_ORBIT_SPEED_METERS_PER_SECOND,
  );
  const autopilotActive = !state.guidanceComplete;
  const programmedTargetDirection = getProgrammedTargetDirection(
    state.rocket.position,
    state.targetDirection,
  );
  const heading = autopilotActive
    ? rotateHeadingTowardTargetInPlane(
        state.rocket.heading,
        programmedTargetDirection,
        turnRateDeg * timeWarp,
      )
    : rotateHeadingFromManualInput(
        state.rocket.heading,
        input.turn,
        timeWarp,
        turnRateDeg,
      );
  const directionReached =
    THREE.MathUtils.radToDeg(heading.angleTo(state.targetDirection)) <=
    GUIDANCE_ANGLE_TOLERANCE_DEG;
  const speedReached =
    state.rocket.velocity.length() + GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND >=
    requiredGuidanceSpeed;
  const guidanceComplete = state.guidanceComplete || (directionReached && speedReached);
  const thrusting = autopilotActive ? !guidanceComplete : input.thrusting;
  const thrustVector = thrusting
    ? heading.clone().multiplyScalar(thrustAcceleration)
    : new THREE.Vector3();

  const next: SimulationState = {
    t: state.t,
    rocket: {
      position: state.rocket.position.clone(),
      velocity: state.rocket.velocity.clone(),
      acceleration: state.rocket.acceleration.clone(),
      heading,
    },
    targetDirection: state.targetDirection.clone(),
    thrusting,
    guidanceComplete,
    impact: state.impact,
  };

  const moonPos = moonPositionMeters(next.t);
  const initialAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    moonPos,
  ).add(thrustVector.clone());

  next.rocket.position
    .add(next.rocket.velocity.clone().multiplyScalar(timeWarp))
    .add(initialAcceleration.clone().multiplyScalar(0.5 * timeWarp * timeWarp));

  const nextTime = next.t + timeWarp;
  const nextMoonPos = moonPositionMeters(nextTime);
  const nextAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    nextMoonPos,
  ).add(thrustVector);

  next.rocket.velocity.add(
    initialAcceleration.add(nextAcceleration).multiplyScalar(0.5 * timeWarp),
  );
  next.rocket.acceleration.copy(nextAcceleration);
  next.t = nextTime;
  next.guidanceComplete =
    next.guidanceComplete ||
    (THREE.MathUtils.radToDeg(next.rocket.heading.angleTo(next.targetDirection)) <=
      GUIDANCE_ANGLE_TOLERANCE_DEG &&
      next.rocket.velocity.length() +
        GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND >=
        requiredGuidanceSpeed);
  next.thrusting = autopilotActive ? !next.guidanceComplete : input.thrusting;

  const earthDistance = next.rocket.position.length();
  const moonDistance = next.rocket.position.clone().sub(nextMoonPos).length();
  const moonRelativeVelocity = next.rocket.velocity
    .clone()
    .sub(moonVelocityMeters(nextTime));
  const moonRelativeSpeed = moonRelativeVelocity.length();

  if (earthDistance <= R_EARTH + surfaceContactOffsetMeters) {
    next.impact = {
      target: "earth",
      speed: next.rocket.velocity.length(),
      relativeSpeed: next.rocket.velocity.length(),
      softLanding: false,
    };
  } else if (moonDistance <= R_MOON + surfaceContactOffsetMeters) {
    next.impact = {
      target: "moon",
      speed: next.rocket.velocity.length(),
      relativeSpeed: moonRelativeSpeed,
      softLanding: moonRelativeSpeed <= SOFT_LANDING_SPEED,
    };
  }

  return next;
}

export function altitudeAboveEarth(
  position: THREE.Vector3,
  earthRadius: number,
): number {
  return position.length() - earthRadius;
}

export function altitudeAboveMoon(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
  moonRadius: number,
): number {
  return rocketPosition.clone().sub(moonPosition).length() - moonRadius;
}
