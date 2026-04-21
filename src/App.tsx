import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_SPEED,
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
} from './physics/bodies'
import { EarthMoonSimulation } from './sim/simulation'
import { createThreeScene } from './three/scene'
import { metersToScene } from './three/objects'
import { Controls } from './ui/controls'

function formatDistance(meters: number): string {
  const clamped = Math.max(meters, 0)

  if (clamped >= 1_000_000) {
    return `${(clamped / 1_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} million km`
  }

  return `${(clamped / 1000).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} km`
}

function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(2)} km/s`
  }

  return `${speed.toFixed(0)} m/s`
}

function formatElapsed(hours: number): string {
  const days = Math.floor(hours / 24)
  const remainingHours = hours - days * 24

  if (days === 0) {
    return `${remainingHours.toFixed(1)} hr`
  }

  return `${days} d ${remainingHours.toFixed(1)} hr`
}

function getMissionPhase(altitudeEarth: number, altitudeMoon: number): string {
  const safeAltitudeEarth = Math.max(altitudeEarth, 0)
  const safeAltitudeMoon = Math.max(altitudeMoon, 0)

  if (safeAltitudeMoon < 80_000) return 'Lunar approach'
  if (safeAltitudeEarth < 80_000) return 'Surface departure'
  if (safeAltitudeEarth < 40_000_000) return 'Earth escape arc'

  return 'Translunar coast'
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const simulation = useMemo(
    () =>
      new EarthMoonSimulation({
        launchSpeed: DEFAULT_SPEED,
        launchAngleDeg: DEFAULT_ANGLE_DEG,
        dt: DEFAULT_DT,
      }),
    [],
  )

  const [running, setRunning] = useState(false)
  const [launchSpeed, setLaunchSpeed] = useState(DEFAULT_SPEED)
  const [launchAngleDeg, setLaunchAngleDeg] = useState(DEFAULT_ANGLE_DEG)
  const [dt, setDt] = useState(DEFAULT_DT)
  const [showTrail, setShowTrail] = useState(true)
  const [showVectors, setShowVectors] = useState(false)
  const [status, setStatus] = useState("Rocket staged on Earth's surface.")
  const [telemetry, setTelemetry] = useState(() => simulation.getTelemetry())

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    simulation.setConfig({ launchSpeed, launchAngleDeg, dt })
  }, [simulation, launchSpeed, launchAngleDeg, dt])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const bundle = createThreeScene(mount)
    const { scene, camera, renderer, controls, objects } = bundle

    function syncScene() {
      const simState = simulation.getState()
      const telemetryNow = simulation.getTelemetry()

      objects.moon.position.copy(metersToScene(telemetryNow.moonPosition))
      objects.rocket.position.copy(metersToScene(simState.rocket.position))
      objects.launchRing.visible = telemetryNow.altitudeEarth < 5_000
      objects.earthAtmosphere.rotation.y += 0.0007

      objects.trailLine.visible = showTrail
      const trailPoints = simulation.getTrail().map((p) => metersToScene(p))
      objects.trailLine.geometry.dispose()
      objects.trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints)

      objects.velocityArrow.visible = showVectors
      objects.accelerationArrow.visible = showVectors

      if (showVectors) {
        const rocketPos = objects.rocket.position.clone()
        const v = simState.rocket.velocity.clone()
        const a = simState.rocket.acceleration.clone()

        const vLen = Math.max(v.length(), 1)
        objects.velocityArrow.position.copy(rocketPos)
        objects.velocityArrow.setDirection(v.normalize())
        objects.velocityArrow.setLength(Math.min(60, vLen / 250), 6, 4)

        const aLen = Math.max(a.length(), 1e-9)
        objects.accelerationArrow.position.copy(rocketPos)
        objects.accelerationArrow.setDirection(a.normalize())
        objects.accelerationArrow.setLength(Math.min(50, aLen * 1.5e6), 6, 4)
      }

      if (simState.rocket.velocity.lengthSq() > 1e-6) {
        const heading = simState.rocket.velocity.clone().normalize()
        objects.rocket.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          heading,
        )
      }

      setTelemetry(telemetryNow)

      if (simState.hit === 'earth') {
        setRunning(false)
        setStatus('Rocket impacted Earth.')
      } else if (simState.hit === 'moon') {
        setRunning(false)
        setStatus('Rocket impacted Moon.')
      } else if (runningRef.current) {
        setStatus(`Running: ${getMissionPhase(telemetryNow.altitudeEarth, telemetryNow.altitudeMoon)}.`)
      }
    }

    function onResize() {
      if (!mountRef.current) return
      camera.aspect = mountRef.current.clientWidth / Math.max(mountRef.current.clientHeight, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }

    window.addEventListener('resize', onResize)

    function frame() {
      if (runningRef.current) {
        simulation.tick()
      }

      syncScene()
      controls.update()
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(frame)
    }

    frame()

    return () => {
      window.removeEventListener('resize', onResize)
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
      bundle.dispose()
    }
  }, [simulation, showTrail, showVectors])

  function resetSimulation() {
    simulation.setConfig({ launchSpeed, launchAngleDeg, dt })
    simulation.reset()
    setRunning(false)
    setTelemetry(simulation.getTelemetry())
    setStatus("Rocket reset to Earth's surface.")
  }

  const missionPhase = getMissionPhase(telemetry.altitudeEarth, telemetry.altitudeMoon)
  const currentAltitudeEarth = Math.max(telemetry.altitudeEarth, 0)
  const currentAltitudeMoon = Math.max(telemetry.altitudeMoon, 0)
  const lunarTransferGap = Math.max(
    EARTH_MOON_DISTANCE - R_EARTH - R_MOON - currentAltitudeEarth,
    0,
  )

  return (
    <div className="min-h-screen overflow-hidden bg-[#02060d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,172,255,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(255,185,107,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,13,0.94),_rgba(3,9,18,0.98))]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 md:px-6 lg:px-8 lg:py-6">
        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
          <div className="rounded-[2.25rem] border border-white/10 bg-[#07111f]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">
                Earth to Moon
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-amber-100">
                Three.js orbital sandbox
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              Launch from Earth&apos;s surface and tune a ballistic path toward the Moon.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              This simulator now stages the rocket directly on Earth, shows a cleaner
              mission readout, and uses a more legible space scene so the transfer arc
              is easier to understand.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Mission Phase" value={missionPhase} accent="cyan" />
              <MetricCard
                label="Current Speed"
                value={formatSpeed(telemetry.speed)}
                accent="amber"
              />
              <MetricCard
                label="Peak Earth Altitude"
                value={formatDistance(telemetry.peakAltitudeEarth)}
                accent="cyan"
              />
              <MetricCard
                label="Closest Moon Approach"
                value={formatDistance(telemetry.closestMoonApproach)}
                accent="amber"
              />
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-white/10 bg-[#0b1628]/82 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Mission Notes
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <p>
                The current model is two-body gravity plus a moving Moon. There is no
                thrust curve, atmospheric drag, or patched-conic guidance yet.
              </p>
              <p>
                Distances and body sizes use the same compression factor, so the visual
                proportions stay consistent even though the whole system is scaled down.
              </p>
              <p className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-slate-200">
                Approximate Earth-to-Moon surface gap: {formatDistance(lunarTransferGap)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
          <Controls
            launchSpeed={launchSpeed}
            launchAngleDeg={launchAngleDeg}
            dt={dt}
            showTrail={showTrail}
            showVectors={showVectors}
            running={running}
            onLaunchSpeedChange={setLaunchSpeed}
            onLaunchAngleChange={setLaunchAngleDeg}
            onDtChange={setDt}
            onShowTrailChange={setShowTrail}
            onShowVectorsChange={setShowVectors}
            onToggleRunning={() => {
              setRunning((prev) => !prev)
              setStatus(running ? 'Paused.' : 'Running...')
            }}
            onReset={resetSimulation}
          />

          <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Telemetry
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TelemetryRow label="Elapsed mission time" value={formatElapsed(telemetry.hours)} />
              <TelemetryRow label="Current speed" value={formatSpeed(telemetry.speed)} />
              <TelemetryRow
                label="Altitude above Earth"
                value={formatDistance(currentAltitudeEarth)}
              />
              <TelemetryRow
                label="Altitude above Moon"
                value={formatDistance(currentAltitudeMoon)}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/8 px-4 py-3 text-slate-200">
              Status: {status}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/82 p-5 text-sm leading-6 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            The controls are still intentionally simple. If you want a bigger next step,
            the highest-value upgrades are a burn timeline, lunar capture burn, mission
            presets, and textured Earth/Moon assets.
          </div>
        </div>

          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#030914]/78 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-gradient-to-b from-[#040b16]/95 to-transparent px-5 py-4 text-xs uppercase tracking-[0.22em] text-slate-300">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                  Scene View
                </span>
                <span>Orbit to inspect the transfer geometry</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.68rem]">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Earth
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Moon orbit
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Trajectory
                </span>
              </div>
            </div>

            <div
              ref={mountRef}
              className="h-[min(78vh,860px)] min-h-[620px] w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  accent: 'cyan' | 'amber'
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  const accentClasses =
    accent === 'cyan'
      ? 'border-cyan-300/12 bg-cyan-300/8 text-cyan-50'
      : 'border-amber-300/12 bg-amber-300/8 text-amber-50'

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${accentClasses}`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  )
}

type TelemetryRowProps = {
  label: string
  value: string
}

function TelemetryRow({ label, value }: TelemetryRowProps) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-3">
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-slate-100">{value}</div>
    </div>
  )
}
