import * as THREE from 'three'
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
  EARTH_MOON_DISTANCE,
  MAX_SIMULATION_STEP,
  R_EARTH,
  R_MOON,
  makeInitialSimulationState,
  moonVelocityMeters,
  moonPositionMeters,
} from '../physics/bodies'
import type { ManeuverInput } from '../physics/bodies'
import type { SimulationState } from '../physics/bodies'
import { altitudeAboveEarth, altitudeAboveMoon, stepSimulation } from '../physics/integrator'
import { TRAIL_POINT_CAPACITY } from './trail'

export type SimulationConfig = {
  launchSpeed: number
  launchAngleDeg: number
  launchAzimuthDeg: number
  dt: number
  thrustAcceleration: number
  turnRateDeg: number
}

export type SimulationTelemetry = {
  hours: number
  speed: number
  relativeMoonSpeed: number
  altitudeEarth: number
  altitudeMoon: number
  peakAltitudeEarth: number
  closestMoonApproach: number
  moonPosition: THREE.Vector3
}

export class EarthMoonSimulation {
  private config: SimulationConfig
  private state: SimulationState
  private trail = Array.from(
    { length: TRAIL_POINT_CAPACITY },
    () => new THREE.Vector3(),
  )
  private trailStart = 0
  private trailCount = 0
  private peakAltitudeEarth = 0
  private closestMoonApproach = Infinity

  constructor(
    config: SimulationConfig = {
      launchSpeed: DEFAULT_SPEED,
      launchAngleDeg: DEFAULT_ANGLE_DEG,
      launchAzimuthDeg: DEFAULT_LAUNCH_AZIMUTH_DEG,
      dt: DEFAULT_DT,
      thrustAcceleration: 4,
      turnRateDeg: 1.25,
    },
  ) {
    this.config = config
    this.state = makeInitialSimulationState(
      config.launchSpeed,
      config.launchAngleDeg,
      config.launchAzimuthDeg,
    )
    this.initializeTrail()
    this.updateFlightExtrema()
  }

  setConfig(config: SimulationConfig): void {
    this.config = config
  }

  reset(): void {
    this.state = makeInitialSimulationState(
      this.config.launchSpeed,
      this.config.launchAngleDeg,
      this.config.launchAzimuthDeg,
    )
    this.initializeTrail()
    this.peakAltitudeEarth = 0
    this.closestMoonApproach = Infinity
    this.updateFlightExtrema()
  }

  tick(input: ManeuverInput = { thrusting: false, turn: 0 }): void {
    const steps = Math.max(1, Math.ceil(this.config.dt / MAX_SIMULATION_STEP))
    const stepDt = this.config.dt / steps

    for (let index = 0; index < steps; index += 1) {
      this.state = stepSimulation(
        this.state,
        stepDt,
        input,
        this.config.thrustAcceleration,
        this.config.turnRateDeg,
      )
      this.appendTrailPoint(this.state.rocket.position)
      this.updateFlightExtrema()
      if (this.state.impact) break
    }
  }

  getState(): SimulationState {
    return this.state
  }

  getTrail(): THREE.Vector3[] {
    const orderedTrail: THREE.Vector3[] = []

    for (let index = 0; index < this.trailCount; index += 1) {
      orderedTrail.push(
        this.trail[(this.trailStart + index) % TRAIL_POINT_CAPACITY].clone(),
      )
    }

    return orderedTrail
  }

  getTrailLength(): number {
    return this.trailCount
  }

  copyTrailPositionsTo(
    target: Float32Array,
    scale: number,
    startIndex: number = 0,
  ): number {
    const from = Math.max(0, Math.min(startIndex, this.trailCount))

    for (let index = from; index < this.trailCount; index += 1) {
      const point = this.trail[(this.trailStart + index) % TRAIL_POINT_CAPACITY]
      const offset = index * 3

      target[offset] = point.x * scale
      target[offset + 1] = point.y * scale
      target[offset + 2] = point.z * scale
    }

    return this.trailCount
  }

  getTelemetry(): SimulationTelemetry {
    const moonPos = moonPositionMeters(this.state.t)
    return {
      hours: this.state.t / 3600,
      speed: this.state.rocket.velocity.length(),
      relativeMoonSpeed: this.state.rocket.velocity.clone().sub(moonVelocityMeters(this.state.t)).length(),
      altitudeEarth: altitudeAboveEarth(this.state.rocket.position, R_EARTH),
      altitudeMoon: altitudeAboveMoon(this.state.rocket.position, moonPos, R_MOON),
      peakAltitudeEarth: this.peakAltitudeEarth,
      closestMoonApproach: this.closestMoonApproach,
      moonPosition: moonPos,
    }
  }

  getSystemExtentMeters(): number {
    return EARTH_MOON_DISTANCE
  }

  private updateFlightExtrema(): void {
    const moonPos = moonPositionMeters(this.state.t)
    const altitudeEarth = Math.max(
      altitudeAboveEarth(this.state.rocket.position, R_EARTH),
      0,
    )
    const altitudeMoon = Math.max(
      altitudeAboveMoon(this.state.rocket.position, moonPos, R_MOON),
      0,
    )

    this.peakAltitudeEarth = Math.max(this.peakAltitudeEarth, altitudeEarth)
    this.closestMoonApproach = Math.min(this.closestMoonApproach, altitudeMoon)
  }

  private initializeTrail(): void {
    this.trailStart = 0
    this.trailCount = 1
    this.trail[0].copy(this.state.rocket.position)
  }

  private appendTrailPoint(position: THREE.Vector3): void {
    if (this.trailCount < TRAIL_POINT_CAPACITY) {
      this.trail[this.trailCount].copy(position)
      this.trailCount += 1
      return
    }

    this.trail[this.trailStart].copy(position)
    this.trailStart = (this.trailStart + 1) % TRAIL_POINT_CAPACITY
  }
}
