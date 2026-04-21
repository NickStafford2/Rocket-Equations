import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_SPEED,
} from './physics/bodies'
import { EarthMoonSimulation } from './sim/simulation'
import { createThreeScene } from './three/scene'
import { metersToScene } from './three/objects'
import { Controls } from './ui/controls'

function formatKm(meters: number): string {
  return `${(meters / 1000).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} km`
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const [running, setRunning] = useState(false)
  const [launchSpeed, setLaunchSpeed] = useState(DEFAULT_SPEED)
  const [launchAngleDeg, setLaunchAngleDeg] = useState(DEFAULT_ANGLE_DEG)
  const [dt, setDt] = useState(DEFAULT_DT)
  const [showTrail, setShowTrail] = useState(true)
  const [showVectors, setShowVectors] = useState(false)
  const [status, setStatus] = useState('Ready.')
  const [telemetry, setTelemetry] = useState({
    hours: 0,
    speed: DEFAULT_SPEED,
    altitudeEarth: 300_000,
    altitudeMoon: 384_400_000,
  })

  const simulation = useMemo(
    () =>
      new EarthMoonSimulation({
        launchSpeed: DEFAULT_SPEED,
        launchAngleDeg: DEFAULT_ANGLE_DEG,
        dt: DEFAULT_DT,
      }),
    [],
  )

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

      setTelemetry({
        hours: telemetryNow.hours,
        speed: telemetryNow.speed,
        altitudeEarth: telemetryNow.altitudeEarth,
        altitudeMoon: telemetryNow.altitudeMoon,
      })

      if (simState.hit === 'earth') {
        setRunning(false)
        setStatus('Rocket impacted Earth.')
      } else if (simState.hit === 'moon') {
        setRunning(false)
        setStatus('Rocket impacted Moon.')
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
    setStatus('Rocket reset.')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
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

          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 text-sm space-y-2">
            <div className="font-medium text-slate-200">Telemetry</div>
            <div>Elapsed time: {telemetry.hours.toFixed(2)} hr</div>
            <div>
              Speed:{' '}
              {telemetry.speed.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              m/s
            </div>
            <div>Altitude above Earth: {formatKm(telemetry.altitudeEarth)}</div>
            <div>Altitude above Moon: {formatKm(telemetry.altitudeMoon)}</div>
            <div className="pt-2 text-slate-300">Status: {status}</div>
          </div>

          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 text-sm leading-6 text-slate-300">
            This is a simple ballistic simulation with Earth and Moon gravity only.
            The rocket gets an initial velocity and then coasts.
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl overflow-hidden min-h-[720px]">
          <div ref={mountRef} className="w-full h-[720px]" />
        </div>
      </div>
    </div>
  )
}
