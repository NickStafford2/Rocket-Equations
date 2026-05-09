// TakramAtmosphereTest.tsx

import { useEffect, useRef } from "react";
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
  Mesh,
  MeshPhysicalMaterial,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Timer,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

const referenceDate = new Date("2000-06-01T10:00:00Z");
const geodetic = new Geodetic(0, radians(67), 1000);
const position = geodetic.toECEF();
const up = Ellipsoid.WGS84.getSurfaceNormal(position);

export function TakramAtmospherePrototype() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const inertialToECEFMatrix = new Matrix4();
    const sunDirection = new Vector3();
    const moonDirection = new Vector3();

    let renderer: WebGLRenderer;
    let camera: PerspectiveCamera;
    let controls: OrbitControls;
    let timer: Timer;
    let scene: Scene;
    let skyMaterial: SkyMaterial;
    let skyLight: SkyLightProbe;
    let sunLight: SunDirectionalLight;
    let aerialPerspective: AerialPerspectiveEffect;
    let composer: EffectComposer;

    async function init() {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const aspect = width / height;

      camera = new PerspectiveCamera(75, aspect, 10, 1e6);
      camera.position.copy(position);
      camera.up.copy(up);

      controls = new OrbitControls(camera, container);
      controls.enableDamping = true;
      controls.minDistance = 1e3;
      controls.target.copy(position);

      timer = new Timer();
      scene = new Scene();

      sunLight = new SunDirectionalLight({ distance: 300 });
      sunLight.target.position.copy(position);
      sunLight.castShadow = true;
      sunLight.shadow.camera.top = 300;
      sunLight.shadow.camera.bottom = -300;
      sunLight.shadow.camera.left = -300;
      sunLight.shadow.camera.right = 300;
      sunLight.shadow.camera.near = 0;
      sunLight.shadow.camera.far = 600;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.normalBias = 1;

      scene.add(sunLight);
      scene.add(sunLight.target);

      const group = new Group();

      Ellipsoid.WGS84.getEastNorthUpFrame(position).decompose(
        group.position,
        group.quaternion,
        group.scale,
      );

      scene.add(group);

      const torusKnot = new Mesh(
        new TorusKnotGeometry(200, 60, 256, 64),
        new MeshPhysicalMaterial({
          color: "white",
          roughness: 0.5,
          ior: 1.45,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
        }),
      );

      torusKnot.castShadow = true;
      torusKnot.receiveShadow = true;
      group.add(torusKnot);

      skyMaterial = new SkyMaterial();

      const sky = new Mesh(new PlaneGeometry(2, 2), skyMaterial);
      sky.frustumCulled = false;
      scene.add(sky);

      skyLight = new SkyLightProbe();
      skyLight.position.copy(position);
      scene.add(skyLight);

      aerialPerspective = new AerialPerspectiveEffect(camera);

      renderer = new WebGLRenderer({
        depth: false,
        logarithmicDepthBuffer: true,
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.toneMapping = NoToneMapping;
      renderer.toneMappingExposure = 10;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;

      composer = new EffectComposer(renderer, {
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

      const generator = new PrecomputedTexturesGenerator(renderer);

      generator.update().catch((error: unknown) => {
        console.error(error);
      });

      const { textures } = generator;

      Object.assign(skyMaterial, textures);
      sunLight.transmittanceTexture = textures.transmittanceTexture;
      skyLight.irradianceTexture = textures.irradianceTexture;
      Object.assign(aerialPerspective, textures);

      container.appendChild(renderer.domElement);

      function onResize() {
        const nextWidth = container.clientWidth || window.innerWidth;
        const nextHeight = container.clientHeight || window.innerHeight;

        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(nextWidth, nextHeight);
        composer.setSize(nextWidth, nextHeight);
      }

      function render(time: number) {
        if (disposed) return;

        timer.update(time);

        const date = +referenceDate + ((timer.getElapsed() * 5e6) % 864e5);

        getECIToECEFRotationMatrix(date, inertialToECEFMatrix);

        getSunDirectionECI(date, sunDirection).applyMatrix4(
          inertialToECEFMatrix,
        );

        getMoonDirectionECI(date, moonDirection).applyMatrix4(
          inertialToECEFMatrix,
        );

        skyMaterial.sunDirection.copy(sunDirection);
        skyMaterial.moonDirection.copy(moonDirection);

        sunLight.sunDirection.copy(sunDirection);
        skyLight.sunDirection.copy(sunDirection);
        aerialPerspective.sunDirection.copy(sunDirection);

        sunLight.update();
        skyLight.update();
        controls.update();

        composer.render();
      }

      window.addEventListener("resize", onResize);
      renderer.setAnimationLoop(render);

      onResize();

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    let cleanupResize: (() => void) | undefined;

    void init().then((cleanup) => {
      cleanupResize = cleanup;
    });

    return () => {
      disposed = true;

      cleanupResize?.();

      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();

        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      }

      controls?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-screen w-screen" />;
}
