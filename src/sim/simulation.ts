import * as THREE from "three";
import {
  ROCKET_DEFAULT_ANGLE_DEG,
  DEFAULT_TIME_WARP,
  ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG,
  ROCKET_DEFAULT_SPEED,
  EARTH_MOON_DISTANCE,
  MAX_SIMULATION_STEP,
  R_EARTH,
  R_MOON,
  makeInitialSimulationState,
  moonVelocityMeters,
  moonPositionMeters,
} from "../physics/bodies";
import type { ManeuverInput } from "../physics/bodies";
import type { SimulationState } from "../physics/bodies";
import {
  altitudeAboveEarth,
  altitudeAboveMoon,
  stepSimulation,
} from "../physics/integrator";
import { ROCKET_PHYSICAL_MODEL_SPECS } from "../rocket/definitions";
import { getRocketModelVariantForState } from "../rocket/variant";
import {
  PREDICTION_POINT_CAPACITY,
  PREDICTION_REFRESH_INTERVAL_MS,
  type TrajectoryPredictionState,
  predictTrajectory,
} from "./prediction";
import { TRAIL_POINT_CAPACITY } from "./trail";

export type SimulationConfig = {
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  launchAltitudeMeters: number;
  timeWarp: number;
  thrustAcceleration: number;
  turnRateDeg: number;
};

export type SimulationTelemetry = {
  hours: number;
  speed: number;
  relativeMoonSpeed: number;
  altitudeEarth: number;
  altitudeMoon: number;
  peakAltitudeEarth: number;
  closestMoonApproach: number;
  moonPosition: THREE.Vector3;
};

export class EarthMoonSimulation {
  private config: SimulationConfig;
  private state: SimulationState;
  private trail = Array.from(
    { length: TRAIL_POINT_CAPACITY },
    () => new THREE.Vector3(),
  );
  private trailStart = 0;
  private trailCount = 0;
  private prediction = Array.from(
    { length: PREDICTION_POINT_CAPACITY },
    () => new THREE.Vector3(),
  );
  private predictionCount = 0;
  private predictionLastUpdatedAt = Number.NEGATIVE_INFINITY;
  private predictionKey = "";
  private peakAltitudeEarth = 0;
  private closestMoonApproach = Infinity;

  constructor(
    config: SimulationConfig = {
      launchSpeed: ROCKET_DEFAULT_SPEED,
      launchAngleDeg: ROCKET_DEFAULT_ANGLE_DEG,
      launchAzimuthDeg: ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG,
      launchAltitudeMeters:
        ROCKET_PHYSICAL_MODEL_SPECS["saturn-v"].surfaceContactOffsetMeters,
      timeWarp: DEFAULT_TIME_WARP,
      thrustAcceleration: 4,
      turnRateDeg: 1.25,
    },
  ) {
    this.config = config;
    this.state = makeInitialSimulationState(
      config.launchSpeed,
      config.launchAngleDeg,
      config.launchAzimuthDeg,
      config.launchAltitudeMeters,
    );
    this.initializeTrail();
    this.updateFlightExtrema();
  }

  setConfig(config: SimulationConfig): void {
    this.config = config;
  }

  getTimeWarp(): number {
    return this.config.timeWarp;
  }

  reset(): void {
    this.state = makeInitialSimulationState(
      this.config.launchSpeed,
      this.config.launchAngleDeg,
      this.config.launchAzimuthDeg,
      this.config.launchAltitudeMeters,
    );
    this.initializeTrail();
    this.peakAltitudeEarth = 0;
    this.closestMoonApproach = Infinity;
    this.updateFlightExtrema();
  }

  tick(
    input: ManeuverInput = { thrusting: false, turn: 0 },
    simulatedSeconds: number = this.config.timeWarp,
  ): void {
    if (
      !Number.isFinite(simulatedSeconds) ||
      simulatedSeconds <= 0 ||
      this.state.impact
    ) {
      return;
    }

    const steps = Math.max(
      1,
      Math.ceil(simulatedSeconds / MAX_SIMULATION_STEP),
    );
    const stepDt = simulatedSeconds / steps;

    for (let index = 0; index < steps; index += 1) {
      const moonPosition = moonPositionMeters(this.state.t);
      this.state = stepSimulation(
        this.state,
        stepDt,
        input,
        this.config.thrustAcceleration,
        this.config.turnRateDeg,
        this.getSurfaceContactOffsetMeters(moonPosition),
      );
      this.appendTrailPoint(this.state.rocket.position);
      this.updateFlightExtrema();
      if (this.state.impact) break;
    }
  }

  getState(): SimulationState {
    return this.state;
  }

  getTrail(): THREE.Vector3[] {
    const orderedTrail: THREE.Vector3[] = [];

    for (let index = 0; index < this.trailCount; index += 1) {
      orderedTrail.push(
        this.trail[(this.trailStart + index) % TRAIL_POINT_CAPACITY].clone(),
      );
    }

    return orderedTrail;
  }

  getTrailLength(): number {
    return this.trailCount;
  }

  getPredictionLength(): number {
    return this.predictionCount;
  }

  copyTrailPositionsTo(
    target: Float32Array,
    scale: number,
    startIndex: number = 0,
  ): number {
    const from = Math.max(0, Math.min(startIndex, this.trailCount));

    for (let index = from; index < this.trailCount; index += 1) {
      const point =
        this.trail[(this.trailStart + index) % TRAIL_POINT_CAPACITY];
      const offset = index * 3;

      target[offset] = point.x * scale;
      target[offset + 1] = point.y * scale;
      target[offset + 2] = point.z * scale;
    }

    return this.trailCount;
  }

  refreshPrediction(
    nowMs: number,
    sourceState: TrajectoryPredictionState,
    running: boolean,
  ): boolean {
    const nextKey = this.serializePredictionState(sourceState);
    const sourceChanged = nextKey !== this.predictionKey;
    const elapsedSinceLastPrediction = nowMs - this.predictionLastUpdatedAt;

    if (
      running &&
      elapsedSinceLastPrediction < PREDICTION_REFRESH_INTERVAL_MS
    ) {
      return false;
    }

    if (
      !running &&
      !sourceChanged &&
      elapsedSinceLastPrediction < PREDICTION_REFRESH_INTERVAL_MS
    ) {
      return false;
    }

    const nextPrediction = predictTrajectory(sourceState);
    this.predictionCount = Math.min(
      nextPrediction.length,
      PREDICTION_POINT_CAPACITY,
    );

    for (let index = 0; index < this.predictionCount; index += 1) {
      this.prediction[index].copy(nextPrediction[index]);
    }

    this.predictionKey = nextKey;
    this.predictionLastUpdatedAt = nowMs;

    return true;
  }

  copyPredictionPositionsTo(target: Float32Array, scale: number): number {
    for (let index = 0; index < this.predictionCount; index += 1) {
      const point = this.prediction[index];
      const offset = index * 3;

      target[offset] = point.x * scale;
      target[offset + 1] = point.y * scale;
      target[offset + 2] = point.z * scale;
    }

    return this.predictionCount;
  }

  getTelemetry(): SimulationTelemetry {
    const moonPos = moonPositionMeters(this.state.t);
    const surfaceContactOffsetMeters = this.getSurfaceContactOffsetMeters(
      moonPos,
    );
    return {
      hours: this.state.t / 3600,
      speed: this.state.rocket.velocity.length(),
      relativeMoonSpeed: this.state.rocket.velocity
        .clone()
        .sub(moonVelocityMeters(this.state.t))
        .length(),
      altitudeEarth:
        altitudeAboveEarth(this.state.rocket.position, R_EARTH) -
        surfaceContactOffsetMeters,
      altitudeMoon:
        altitudeAboveMoon(this.state.rocket.position, moonPos, R_MOON) -
        surfaceContactOffsetMeters,
      peakAltitudeEarth: this.peakAltitudeEarth,
      closestMoonApproach: this.closestMoonApproach,
      moonPosition: moonPos,
    };
  }

  getSystemExtentMeters(): number {
    return EARTH_MOON_DISTANCE;
  }

  private updateFlightExtrema(): void {
    const moonPos = moonPositionMeters(this.state.t);
    const surfaceContactOffsetMeters = this.getSurfaceContactOffsetMeters(
      moonPos,
    );
    const altitudeEarth = Math.max(
      altitudeAboveEarth(this.state.rocket.position, R_EARTH) -
        surfaceContactOffsetMeters,
      0,
    );
    const altitudeMoon = Math.max(
      altitudeAboveMoon(this.state.rocket.position, moonPos, R_MOON) -
        surfaceContactOffsetMeters,
      0,
    );

    this.peakAltitudeEarth = Math.max(this.peakAltitudeEarth, altitudeEarth);
    this.closestMoonApproach = Math.min(this.closestMoonApproach, altitudeMoon);
  }

  private initializeTrail(): void {
    this.trailStart = 0;
    this.trailCount = 1;
    this.trail[0].copy(this.state.rocket.position);
  }

  private appendTrailPoint(position: THREE.Vector3): void {
    if (this.trailCount < TRAIL_POINT_CAPACITY) {
      this.trail[this.trailCount].copy(position);
      this.trailCount += 1;
      return;
    }

    this.trail[this.trailStart].copy(position);
    this.trailStart = (this.trailStart + 1) % TRAIL_POINT_CAPACITY;
  }

  private getSurfaceContactOffsetMeters(moonPosition: THREE.Vector3): number {
    const rocketModelVariant = getRocketModelVariantForState(
      this.state.rocket.position,
      moonPosition,
    );
    return ROCKET_PHYSICAL_MODEL_SPECS[rocketModelVariant]
      .surfaceContactOffsetMeters;
  }

  private serializePredictionState(state: TrajectoryPredictionState): string {
    return [
      state.t,
      state.position.x,
      state.position.y,
      state.position.z,
      state.velocity.x,
      state.velocity.y,
      state.velocity.z,
    ].join("|");
  }
}
