import { useMemo } from "react";
import * as THREE from "three";
import { createCloudCoverageSampler } from "./CloudCoverageSampler";
import { GlobalCloudShell } from "./GlobalCloudShell";
import { LocalCloudField } from "./LocalCloudField";

type EarthCloudSystemProps = {
  rocketRef: React.RefObject<THREE.Object3D | null>;
  earthRadius: number;
};

export function EarthCloudSystem({
  rocketRef,
  earthRadius,
}: EarthCloudSystemProps) {
  const cloudSampler = useMemo(() => {
    return createCloudCoverageSampler(
      "/textures/earth/clouds_density_1024.png",
    );
  }, []);

  return (
    <>
      <GlobalCloudShell
        earthRadius={earthRadius}
        textureUrl="/textures/earth/clouds_8k.png"
        opacity={0.45}
      />

      <LocalCloudField
        rocketRef={rocketRef}
        earthRadius={earthRadius}
        cloudBottomAltitude={earthRadius * 0.005}
        cloudTopAltitude={earthRadius * 0.045}
        sampler={cloudSampler}
        cloudSpriteUrl="/textures/clouds/cloud_puff.png"
        count={350}
        fieldRadius={earthRadius * 0.035}
      />
    </>
  );
}
