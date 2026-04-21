import * as THREE from 'three'
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_SPEED,
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
  makeInitialSimulationState,
  moonPositionMeters,
} from '../physics/bodies'
import type { SimulationState } from '../physics/bodies'
import { altitudeAboveEarth, altitudeAboveMoon, stepSimulation } from '../physics/integrator'

export type SimulationConfig = {
  launchSpeed: number
  launchAngleDeg: number
  dt: number
}

export type SimulationTelemetry = {
  hours: number
  speed: number
  altitudeEarth: number
  altitudeMoon: number
  peakAltitudeEarth: number
  closestMoonApproach: number
  moonPosition: THREE.Vector3
}

export class EarthMoonSimulation {
  private config: SimulationConfig
  private state: SimulationState
  private trail: THREE.Vector3[] = []
  private peakAltitudeEarth = 0
  private closestMoonApproach = Infinity

  constructor(
    config: SimulationConfig = {
      launchSpeed: DEFAULT_SPEED,
      launchAngleDeg: DEFAULT_ANGLE_DEG,
      dt: DEFAULT_DT,
    },
  ) {
    this.config = config
    this.state = makeInitialSimulationState(config.launchSpeed, config.launchAngleDeg)
    this.trail = [this.state.rocket.position.clone()]
    this.updateFlightExtrema()
  }

  setConfig(config: SimulationConfig): void {
    this.config = config
  }

  reset(): void {
    this.state = makeInitialSimulationState(
      this.config.launchSpeed,
      this.config.launchAngleDeg,
    )
    this.trail = [this.state.rocket.position.clone()]
    this.peakAltitudeEarth = 0
    this.closestMoonApproach = Infinity
    this.updateFlightExtrema()
  }

  tick(): void {
    this.state = stepSimulation(this.state, this.config.dt)
    this.trail.push(this.state.rocket.position.clone())
    if (this.trail.length > 5000) this.trail.shift()
    this.updateFlightExtrema()
  }

  getState(): SimulationState {
    return this.state
  }

  getTrail(): THREE.Vector3[] {
    return this.trail
  }

  getTelemetry(): SimulationTelemetry {
    const moonPos = moonPositionMeters(this.state.t)
    return {
      hours: this.state.t / 3600,
      speed: this.state.rocket.velocity.length(),
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
}
