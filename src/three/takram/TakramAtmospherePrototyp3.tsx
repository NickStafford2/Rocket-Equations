// TakramAtmospherePrototype.tsx

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ScreenQuad } from "@react-three/drei";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import {
  Group,
  HalfFloatType,
  Matrix4,
  MeshPhysicalMaterial,
  NoToneMapping,
  PCFSoftShadowMap,
  Timer,
  TorusKnotGeometry,
  Vector3,
} from "three";

import {
  AerialPerspectiveEffect,
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
  PrecomputedTexturesGenerator,
  SkyLightProbe,
  SkyMaterial,
  SunDirectionalLight,
} from "@takram/three-atmosphere";
import { Ellipsoid, Geodetic, radians } from "@takram/three-geospatial";
import {
  DitheringEffect,
  LensFlareEffect,
} from "@takram/three-geospatial-effects";
import { EarthCloudLayer } from "./EarthCloudLayer";
import { EarthSurface } from "./EarthSurface";

const referenceDate = new Date("2000-06-01T10:00:00Z");

const geodetic = new Geodetic(0, radians(67), 1000);
const position = geodetic.toECEF();
const up = Ellipsoid.WGS84.getSurfaceNormal(position);
const CAMERA_ALTITUDE_METERS = 1_200_000;
const CAMERA_FAR_METERS = 20_000_000;
const CAMERA_POSITION = position
  .clone()
  .add(up.clone().multiplyScalar(CAMERA_ALTITUDE_METERS));

function TakramAtmosphereScene() {
  const { gl, scene, camera, size } = useThree();

  const composerRef = useRef<EffectComposer | null>(null);
  const aerialPerspectiveRef = useRef<AerialPerspectiveEffect | null>(null);

  const timerRef = useRef(new Timer());
  const inertialToECEFMatrixRef = useRef(new Matrix4());
  const sunDirectionRef = useRef(new Vector3());
  const moonDirectionRef = useRef(new Vector3());

  const skyMaterial = useMemo(() => new SkyMaterial(), []);

  const sunLight = useMemo(() => {
    const light = new SunDirectionalLight({ distance: 300 });

    light.target.position.copy(position);
    light.castShadow = true;

    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    light.shadow.camera.left = -300;
    light.shadow.camera.right = 300;
    light.shadow.camera.near = 0;
    light.shadow.camera.far = 600;

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.normalBias = 1;

    return light;
  }, []);

  const skyLight = useMemo(() => {
    const probe = new SkyLightProbe();
    probe.position.copy(position);
    return probe;
  }, []);

  const localFrame = useMemo(() => {
    const group = new Group();

    Ellipsoid.WGS84.getEastNorthUpFrame(position).decompose(
      group.position,
      group.quaternion,
      group.scale,
    );

    return group;
  }, []);

  const torusGeometry = useMemo(
    () => new TorusKnotGeometry(200, 60, 256, 64),
    [],
  );

  const torusMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "white",
        roughness: 0.5,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
    [],
  );

  useEffect(() => {
    camera.position.copy(CAMERA_POSITION);
    camera.up.copy(up);
    camera.lookAt(0, 0, 0);
    camera.near = 10;
    camera.far = CAMERA_FAR_METERS;
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    gl.toneMapping = NoToneMapping;
    gl.toneMappingExposure = 10;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = PCFSoftShadowMap;
  }, [gl]);

  useEffect(() => {
    const aerialPerspective = new AerialPerspectiveEffect(camera);
    aerialPerspectiveRef.current = aerialPerspective;

    const composer = new EffectComposer(gl, {
      frameBufferType: HalfFloatType,
      multisampling: 8,
    });

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, aerialPerspective));
    composer.addPass(
      new EffectPass(
        camera,
        new LensFlareEffect(),
        new ToneMappingEffect({ mode: ToneMappingMode.AGX }),
        new DitheringEffect(),
      ),
    );

    composerRef.current = composer;

    const generator = new PrecomputedTexturesGenerator(gl);

    generator.update().catch((error: unknown) => {
      console.error(error);
    });

    const { textures } = generator;

    Object.assign(skyMaterial, textures);
    sunLight.transmittanceTexture = textures.transmittanceTexture;
    skyLight.irradianceTexture = textures.irradianceTexture;
    Object.assign(aerialPerspective, textures);

    return () => {
      composer.dispose();
      composerRef.current = null;
      aerialPerspectiveRef.current = null;
    };
  }, [camera, gl, scene, skyLight, skyMaterial, sunLight]);

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useEffect(() => {
    return () => {
      skyMaterial.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
    };
  }, [skyMaterial, torusGeometry, torusMaterial]);

  useFrame((_, delta) => {
    const composer = composerRef.current;
    const aerialPerspective = aerialPerspectiveRef.current;

    if (!composer || !aerialPerspective) return;

    const timer = timerRef.current;
    const inertialToECEFMatrix = inertialToECEFMatrixRef.current;
    const sunDirection = sunDirectionRef.current;
    const moonDirection = moonDirectionRef.current;

    timer.update(delta * 1000);

    const date = +referenceDate + ((timer.getElapsed() * 5e6) % 864e5);

    getECIToECEFRotationMatrix(date, inertialToECEFMatrix);

    getSunDirectionECI(date, sunDirection).applyMatrix4(inertialToECEFMatrix);

    getMoonDirectionECI(date, moonDirection).applyMatrix4(inertialToECEFMatrix);

    skyMaterial.sunDirection.copy(sunDirection);
    skyMaterial.moonDirection.copy(moonDirection);

    sunLight.sunDirection.copy(sunDirection);
    skyLight.sunDirection.copy(sunDirection);
    aerialPerspective.sunDirection.copy(sunDirection);

    sunLight.update();
    skyLight.update();

    composer.render();
  }, 1);

  return (
    <>
      <ScreenQuad frustumCulled={false} renderOrder={-1000}>
        <primitive object={skyMaterial} />
      </ScreenQuad>

      <EarthSurface />
      <EarthCloudLayer />

      <primitive object={sunLight} />
      <primitive object={sunLight.target} />
      <primitive object={skyLight} />
      <primitive object={localFrame}>
        <mesh
          geometry={torusGeometry}
          material={torusMaterial}
          castShadow
          receiveShadow
        />
      </primitive>
      <OrbitControls
        enableDamping
        minDistance={1000}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
}

type TakramAtmospherePrototypeProps = {
  className?: string;
};

export function TakramAtmospherePrototype({
  className,
}: TakramAtmospherePrototypeProps) {
  return (
    <div className={className ?? "h-screen w-screen"}>
      <Canvas
        shadows
        gl={{
          logarithmicDepthBuffer: true,
        }}
        camera={{
          fov: 75,
          near: 10,
          far: CAMERA_FAR_METERS,
        }}
      >
        <TakramAtmosphereScene />
      </Canvas>
    </div>
  );
}
