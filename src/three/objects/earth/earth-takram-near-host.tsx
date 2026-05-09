import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Atmosphere,
  Sky,
  SkyLight,
  SunLight,
  type AtmosphereApi,
} from "@takram/three-atmosphere/r3f";
import type { EarthTakramNearRendererBundle } from "./takram-near-renderer";

type EarthTakramNearHostProps = {
  renderer: EarthTakramNearRendererBundle;
};

const REFERENCE_DATE_MS = +new Date("2000-06-01T10:00:00Z");

export function EarthTakramNearHost({
  renderer,
}: EarthTakramNearHostProps) {
  const atmosphereRef = useRef<AtmosphereApi | null>(null);

  useFrame(() => {
    const date = REFERENCE_DATE_MS + ((renderer.elapsedSeconds * 5e6) % 864e5);
    atmosphereRef.current?.updateByDate(date);
  });

  return (
    <primitive object={renderer.root} dispose={null}>
      <Atmosphere ref={atmosphereRef}>
        <Sky />
        <SkyLight />
        <SunLight />
      </Atmosphere>
    </primitive>
  );
}
