import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import {
  AerialPerspective,
  Atmosphere,
  Sky,
} from "@takram/three-atmosphere/r3f";
import { useEffect } from "react";
import * as THREE from "three";

const EARTH_RADIUS_METERS = 6_378_137;
const GROUND_ALTITUDE_METERS = 2_000;
const LOW_ORBIT_ALTITUDE_METERS = 420_000;
const FAR_SPACE_ALTITUDE_METERS = 20_000_000;

const TEST_DATE = new Date("2026-06-21T16:00:00Z");

type TakramAtmospherePrototypeProps = {
  className?: string;
};

export function TakramAtmospherePrototype({
  className,
}: TakramAtmospherePrototypeProps) {
  return (
    <Canvas
      className={className}
      frameloop="always"
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      camera={{
        fov: 55,
        near: 1,
        far: 80_000_000,
        position: [
          EARTH_RADIUS_METERS + LOW_ORBIT_ALTITUDE_METERS,
          EARTH_RADIUS_METERS * 0.08,
          EARTH_RADIUS_METERS * 0.25,
        ],
      }}
    >
      <RendererSettings />
      <InitialCameraLookAt />

      <Atmosphere date={TEST_DATE} correctAltitude>
        <Sky />

        <EarthTestSphere />

        <EffectComposer enableNormalPass>
          <AerialPerspective sunLight skyLight />
        </EffectComposer>
      </Atmosphere>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        minDistance={EARTH_RADIUS_METERS + GROUND_ALTITUDE_METERS}
        maxDistance={EARTH_RADIUS_METERS + FAR_SPACE_ALTITUDE_METERS}
      />

      <CameraButtons />
    </Canvas>
  );
}

function RendererSettings() {
  const { gl } = useThree();

  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl]);

  return null;
}

function InitialCameraLookAt() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function EarthTestSphere() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS_METERS, 128, 128]} />
      <meshBasicMaterial color={new THREE.Color("#1e5f8a")} />
    </mesh>
  );
}

function CameraButtons() {
  const { camera, controls } = useThree();

  function setCameraAltitude(altitudeMeters: number) {
    camera.position.set(
      EARTH_RADIUS_METERS + altitudeMeters,
      EARTH_RADIUS_METERS * 0.04,
      EARTH_RADIUS_METERS * 0.12,
    );

    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const orbitControls = controls as
      | {
          target?: THREE.Vector3;
          update?: () => void;
        }
      | undefined;

    orbitControls?.target?.set(0, 0, 0);
    orbitControls?.update?.();
  }

  return (
    <Html fullscreen>
      <div className="pointer-events-auto absolute top-16 left-4 z-20 flex gap-2">
        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() => setCameraAltitude(GROUND_ALTITUDE_METERS)}
          type="button"
        >
          Ground
        </button>
        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() => setCameraAltitude(LOW_ORBIT_ALTITUDE_METERS)}
          type="button"
        >
          Orbit
        </button>
        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() => setCameraAltitude(FAR_SPACE_ALTITUDE_METERS)}
          type="button"
        >
          Space
        </button>
      </div>
    </Html>
  );
}
