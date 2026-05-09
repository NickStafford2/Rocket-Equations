import * as THREE from "three";
import {
  createEarthAtmosphereMaterial,
  createEarthCloudMaterial,
  createEarthFresnelMaterial,
  createEarthSurfaceMaterial,
} from "./materials";
import type { EarthTextureVariants } from "./textures";
import {
  createEarthLaunchSite,
  type EarthLaunchSiteBundle,
} from "./launch-site";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  ORBIT_METERS_TO_SCENE_UNITS,
} from "../constants";

const EARTH_BASE_ROTATION_Y = Math.PI * 1.15;
const EARTH_SURFACE_SEGMENTS = 144;
const EARTH_ATMOSPHERE_SHELL_SCALE = 1.03;
const EARTH_ATMOSPHERE_SEGMENTS = 96;
const EARTH_CLOUD_SHELL_SCALE = 1.02;
const EARTH_CLOUD_SEGMENTS = 96;
const EARTH_FRESNEL_SHELL_SCALE = 1.0007;
const EARTH_FRESNEL_SEGMENTS = 96;
const OCEAN_RADIUS_METERS = 58_000;
const OCEAN_Y_OFFSET_METERS = -180;

export type EarthNearAtmosphereRendererBundle = {
  atmosphere: THREE.Mesh;
  cloudsFrame: THREE.Group;
  fresnel: THREE.Mesh;
  globe: THREE.Mesh;
  launchCloudField: EarthLaunchSiteBundle["cloudField"];
  launchSite: THREE.Group;
  localOcean: THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial>;
  root: THREE.Group;
};

export function createEarthNearAtmosphereRenderer(
  textures: EarthTextureVariants,
): EarthNearAtmosphereRendererBundle {
  const root = new THREE.Group();
  root.name = "earth-near-atmosphere-renderer";

  const globe = createEarthSurfaceMesh(textures.highDetail);
  globe.rotation.y = EARTH_BASE_ROTATION_Y;

  const cloudsFrame = new THREE.Group();
  cloudsFrame.add(createEarthCloudMesh(textures.highDetail));

  const atmosphere = createEarthAtmosphereMesh();

  const fresnel = createEarthFresnelMesh();
  fresnel.rotation.y = EARTH_BASE_ROTATION_Y;

  const { root: launchSite, cloudField: launchCloudField } =
    createEarthLaunchSite();
  const localOcean = createLocalOceanMesh();

  return {
    atmosphere,
    cloudsFrame,
    fresnel,
    globe,
    launchCloudField,
    launchSite,
    localOcean,
    root,
  };
}

export function updateEarthNearAtmosphereRenderer(
  renderer: EarthNearAtmosphereRendererBundle,
  elapsedSeconds: number,
) {
  renderer.localOcean.material.uniforms.uTime.value = elapsedSeconds;
}

function createEarthSurfaceMesh(
  textures: EarthTextureVariants["highDetail"],
): THREE.Mesh {
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS,
      EARTH_SURFACE_SEGMENTS,
      EARTH_SURFACE_SEGMENTS,
    ),
    createEarthSurfaceMaterial(textures),
  );
  earthMesh.castShadow = true;
  earthMesh.receiveShadow = true;
  return earthMesh;
}

function createEarthCloudMesh(
  textures: EarthTextureVariants["highDetail"],
): THREE.Mesh {
  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS * EARTH_CLOUD_SHELL_SCALE,
      EARTH_CLOUD_SEGMENTS,
      EARTH_CLOUD_SEGMENTS,
    ),
    createEarthCloudMaterial(textures),
  );
  cloudMesh.renderOrder = 1;
  return cloudMesh;
}

function createEarthAtmosphereMesh(): THREE.Mesh {
  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS * EARTH_ATMOSPHERE_SHELL_SCALE,
      EARTH_ATMOSPHERE_SEGMENTS,
      EARTH_ATMOSPHERE_SEGMENTS,
    ),
    createEarthAtmosphereMaterial(),
  );
  atmosphereMesh.renderOrder = 2;
  return atmosphereMesh;
}

function createEarthFresnelMesh(): THREE.Mesh {
  const fresnelMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      EARTH_RENDER_RADIUS_SCENE_UNITS * EARTH_FRESNEL_SHELL_SCALE,
      EARTH_FRESNEL_SEGMENTS,
      EARTH_FRESNEL_SEGMENTS,
    ),
    createEarthFresnelMaterial(),
  );
  fresnelMesh.renderOrder = 3;
  return fresnelMesh;
}

function createLocalOceanMesh(): THREE.Mesh<
  THREE.CircleGeometry,
  THREE.ShaderMaterial
> {
  const ocean = new THREE.Mesh(
    new THREE.CircleGeometry(
      OCEAN_RADIUS_METERS * ORBIT_METERS_TO_SCENE_UNITS,
      96,
    ),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;

        varying vec2 vUv;
        varying float vWave;

        void main() {
          vUv = uv;
          float radial = length(position.xy);
          float wave = sin(radial * 0.045 - uTime * 0.8) * 0.22;
          wave += sin((position.x + position.y) * 0.08 + uTime * 1.15) * 0.1;
          vWave = wave;
          vec3 displaced = vec3(position.xy, wave);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vWave;

        void main() {
          vec2 centeredUv = vUv - 0.5;
          float radial = length(centeredUv);
          float edgeFade = 1.0 - smoothstep(0.34, 0.5, radial);
          float foam = smoothstep(0.42, 0.5, radial) * 0.35;
          vec3 deep = vec3(0.015, 0.095, 0.17);
          vec3 shallow = vec3(0.07, 0.34, 0.5);
          float waveLight = clamp(0.5 + vWave * 1.65, 0.0, 1.0);
          vec3 color = mix(deep, shallow, waveLight);
          color += foam;
          float alpha = edgeFade * 0.78;

          if (alpha <= 0.001) {
            discard;
          }

          gl_FragColor = vec4(color, alpha);
        }
      `,
    }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = OCEAN_Y_OFFSET_METERS * ORBIT_METERS_TO_SCENE_UNITS;
  ocean.renderOrder = 5;
  ocean.receiveShadow = true;
  return ocean;
}
