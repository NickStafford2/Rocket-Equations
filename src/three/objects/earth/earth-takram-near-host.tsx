import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
  PrecomputedTexturesGenerator,
  SkyLightProbe,
  SkyMaterial,
  SunDirectionalLight,
} from "@takram/three-atmosphere";
import type { EarthTakramNearRendererBundle } from "./takram-near-renderer";
import {
  Matrix4,
  Mesh,
  PlaneGeometry,
  Timer,
  Vector3,
} from "three";

type EarthTakramNearHostProps = {
  renderer: EarthTakramNearRendererBundle;
};

const REFERENCE_DATE_MS = +new Date("2000-06-01T10:00:00Z");

export function EarthTakramNearHost({
  renderer,
}: EarthTakramNearHostProps) {
  const { gl } = useThree();
  const timerRef = useRef(new Timer());
  const inertialToECEFMatrixRef = useRef(new Matrix4());
  const sunDirectionRef = useRef(new Vector3());
  const moonDirectionRef = useRef(new Vector3());
  const skyMaterialRef = useRef<SkyMaterial | null>(null);
  const skyLightRef = useRef<SkyLightProbe | null>(null);
  const sunLightRef = useRef<SunDirectionalLight | null>(null);

  useEffect(() => {
    let disposed = false;

    const skyMaterial = new SkyMaterial();
    const sky = new Mesh(new PlaneGeometry(2, 2), skyMaterial);
    sky.frustumCulled = false;

    const skyLight = new SkyLightProbe();
    const sunLight = new SunDirectionalLight({ distance: 300 });

    renderer.root.add(sky);
    renderer.root.add(skyLight);
    renderer.root.add(sunLight);
    renderer.root.add(sunLight.target);

    skyMaterialRef.current = skyMaterial;
    skyLightRef.current = skyLight;
    sunLightRef.current = sunLight;

    const generator = new PrecomputedTexturesGenerator(gl);
    generator
      .update()
      .then(() => {
        if (disposed) {
          return;
        }

        const { textures } = generator;
        Object.assign(skyMaterial, textures);
        sunLight.transmittanceTexture = textures.transmittanceTexture;
        skyLight.irradianceTexture = textures.irradianceTexture;
      })
      .catch((error: unknown) => {
        console.error("Failed to initialize Takram near-Earth textures.", error);
      });

    return () => {
      disposed = true;

      skyMaterialRef.current = null;
      skyLightRef.current = null;
      sunLightRef.current = null;

      renderer.root.remove(sky);
      renderer.root.remove(skyLight);
      renderer.root.remove(sunLight);
      renderer.root.remove(sunLight.target);

      sky.geometry.dispose();
      skyMaterial.dispose();
    };
  }, [gl, renderer]);

  useFrame((_, deltaSeconds) => {
    const skyMaterial = skyMaterialRef.current;
    const skyLight = skyLightRef.current;
    const sunLight = sunLightRef.current;

    if (!skyMaterial || !skyLight || !sunLight) {
      return;
    }

    const timer = timerRef.current;
    const inertialToECEFMatrix = inertialToECEFMatrixRef.current;
    const sunDirection = sunDirectionRef.current;
    const moonDirection = moonDirectionRef.current;

    timer.update(deltaSeconds * 1000);

    const date = REFERENCE_DATE_MS + ((timer.getElapsed() * 5e6) % 864e5);

    getECIToECEFRotationMatrix(date, inertialToECEFMatrix);
    getSunDirectionECI(date, sunDirection).applyMatrix4(inertialToECEFMatrix);
    getMoonDirectionECI(date, moonDirection).applyMatrix4(inertialToECEFMatrix);

    skyMaterial.sunDirection.copy(sunDirection);
    skyMaterial.moonDirection.copy(moonDirection);
    sunLight.sunDirection.copy(sunDirection);
    skyLight.sunDirection.copy(sunDirection);

    sunLight.update();
    skyLight.update();
  });

  return <primitive object={renderer.root} dispose={null} />;
}
