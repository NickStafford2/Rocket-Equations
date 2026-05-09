import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import {
  AerialPerspective,
  Atmosphere,
  LightingMask,
  Sky,
} from "@takram/three-atmosphere/r3f";
import { useEffect } from "react";
import * as THREE from "three";

import { EARTH_RADIUS_METERS } from "./constants";
import { EarthCloudLayer } from "./EarthCloudLayer";
import { EarthSurface } from "./EarthSurface";

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

        <EarthSurface />
        <EarthCloudLayer />

        <EffectComposer enableNormalPass>
          <LightingMask selectionLayer={10} />
          <AerialPerspective sunLight skyLight />
        </EffectComposer>
      </Atmosphere>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        minDistance={EARTH_RADIUS_METERS + 20}
        maxDistance={EARTH_RADIUS_METERS + VERY_FAR_SPACE_ALTITUDE_METERS}
      />
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
