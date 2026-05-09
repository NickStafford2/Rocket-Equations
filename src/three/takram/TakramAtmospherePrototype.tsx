import { Html, OrbitControls, Stars } from "@react-three/drei";
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
const VERY_FAR_SPACE_ALTITUDE_METERS = 45_000_000;

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
        fov: 45,
        near: 1,
        far: 120_000_000,
        position: [
          EARTH_RADIUS_METERS + FAR_SPACE_ALTITUDE_METERS,
          EARTH_RADIUS_METERS * 0.5,
          EARTH_RADIUS_METERS * 1.5,
        ],
      }}
    >
      <RendererSettings />
      <InitialCameraLookAt />

      <color attach="background" args={["#000000"]} />
      <Stars
        radius={90_000_000}
        depth={20_000_000}
        count={8000}
        factor={8}
        saturation={0}
        fade
        speed={0}
      />

      <Atmosphere date={TEST_DATE}>
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
        maxDistance={EARTH_RADIUS_METERS + VERY_FAR_SPACE_ALTITUDE_METERS}
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
    gl.toneMappingExposure = 1.15;
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
      <sphereGeometry args={[EARTH_RADIUS_METERS, 160, 160]} />
      <meshBasicMaterial color={new THREE.Color("#2b78a0")} />
    </mesh>
  );
}

function CameraButtons() {
  const { camera, controls } = useThree();

  function updateControlsTarget(target: THREE.Vector3) {
    const orbitControls = controls as
      | {
          target?: THREE.Vector3;
          update?: () => void;
        }
      | undefined;

    orbitControls?.target?.copy(target);
    orbitControls?.update?.();
  }

  function setSpaceCamera(altitudeMeters: number) {
    camera.position.set(
      EARTH_RADIUS_METERS + altitudeMeters,
      EARTH_RADIUS_METERS * 0.5,
      EARTH_RADIUS_METERS * 1.5,
    );

    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    updateControlsTarget(new THREE.Vector3(0, 0, 0));
  }

  function setOrbitCamera() {
    camera.position.set(
      EARTH_RADIUS_METERS + LOW_ORBIT_ALTITUDE_METERS,
      EARTH_RADIUS_METERS * 0.08,
      EARTH_RADIUS_METERS * 0.22,
    );

    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    updateControlsTarget(new THREE.Vector3(0, 0, 0));
  }

  function setHorizonCamera() {
    const altitude = 35_000;
    const cameraPosition = new THREE.Vector3(
      EARTH_RADIUS_METERS + altitude,
      0,
      0,
    );

    const horizonLookTarget = new THREE.Vector3(
      EARTH_RADIUS_METERS,
      0,
      EARTH_RADIUS_METERS * 0.18,
    );

    camera.position.copy(cameraPosition);
    camera.lookAt(horizonLookTarget);
    camera.updateProjectionMatrix();
    updateControlsTarget(horizonLookTarget);
  }

  function setGroundCamera() {
    const altitude = GROUND_ALTITUDE_METERS;
    const cameraPosition = new THREE.Vector3(
      EARTH_RADIUS_METERS + altitude,
      0,
      0,
    );

    const groundLookTarget = new THREE.Vector3(
      EARTH_RADIUS_METERS,
      0,
      EARTH_RADIUS_METERS * 0.08,
    );

    camera.position.copy(cameraPosition);
    camera.lookAt(groundLookTarget);
    camera.updateProjectionMatrix();
    updateControlsTarget(groundLookTarget);
  }

  return (
    <Html fullscreen>
      <div className="pointer-events-auto absolute top-16 left-4 z-20 flex gap-2">
        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={setGroundCamera}
          type="button"
        >
          Ground
        </button>

        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={setHorizonCamera}
          type="button"
        >
          Horizon
        </button>

        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={setOrbitCamera}
          type="button"
        >
          Orbit
        </button>

        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() => setSpaceCamera(FAR_SPACE_ALTITUDE_METERS)}
          type="button"
        >
          Space
        </button>

        <button
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() => setSpaceCamera(VERY_FAR_SPACE_ALTITUDE_METERS)}
          type="button"
        >
          Far
        </button>
      </div>
    </Html>
  );
}
