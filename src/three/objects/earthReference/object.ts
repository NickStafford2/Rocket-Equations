import * as THREE from "three";
import { TIFFLoader } from "three/examples/jsm/loaders/TIFFLoader.js";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { createBodyLabelSprite } from "../labels";
import { SUN_POSITION } from "../../sun";
import addonVertexShader from "./earth-addon-vertex-shader.glsl?raw";
import atmosphereFragmentShader from "./atmosphere-fragment-shader.glsl?raw";
import earthFragmentShaderSource from "./earth-fragment-shader.glsl?raw";
import earthVertexShader from "./earth-vertex-shader.glsl?raw";
import fresnelFragmentShader from "./fresnel-fragment-shader.glsl?raw";

const EARTH_BASE_ROTATION_Y = Math.PI * 1.15;
const REFERENCE_EARTH_OFFSET = new THREE.Vector3(
  EARTH_RENDER_RADIUS_SCENE_UNITS * 4.5,
  0,
  0,
);
const REFERENCE_EARTH_SCALE = 1.05;

const earthDay2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_daymap.jpg",
  import.meta.url,
).href;
const earthNight2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_nightmap.jpg",
  import.meta.url,
).href;
const earthClouds2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_clouds.jpg",
  import.meta.url,
).href;
const earthNormal2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_normal_map.tif",
  import.meta.url,
).href;
const earthSpecular2kUrl = new URL(
  "../../../assets/textures/earth/2k_earth_specular_map.tif",
  import.meta.url,
).href;

const EARTH_REFERENCE_FRAGMENT_SHADER = earthFragmentShaderSource
  .replace(
    "vec4 cloudsShadow = texture2D(u_cloudTexture, vUv - translVec.xy);",
    [
      "vec3 cloudsShadowSample = texture2D(u_cloudTexture, vUv - translVec.xy).rgb;",
      "float cloudsShadowAlpha = dot(cloudsShadowSample, vec3(0.2126, 0.7152, 0.0722));",
    ].join("\n    "),
  )
  .replace(
    "mixAmountTexture *= (1. - 0.5*cloudsShadow.a);",
    "mixAmountTexture *= (1. - 0.5*cloudsShadowAlpha);",
  )
  .replace(
    "vec4 cloudsColor = texture2D(u_cloudTexture, vUv);",
    [
      "vec3 cloudsColorRgb = texture2D(u_cloudTexture, vUv).rgb;",
      "float cloudsAlpha = dot(cloudsColorRgb, vec3(0.2126, 0.7152, 0.0722));",
      "vec4 cloudsColor = vec4(cloudsColorRgb, cloudsAlpha);",
    ].join("\n    "),
  );

export function createReferenceEarthObjects(loader: THREE.TextureLoader) {
  const textures = loadReferenceEarthTextures(loader);
  const sunRelativePosition = SUN_POSITION.clone().sub(REFERENCE_EARTH_OFFSET);
  const sharedColor = new THREE.Vector3(0.45, 0.55, 1.0);

  const referenceEarthGroup = new THREE.Group();
  referenceEarthGroup.position.copy(REFERENCE_EARTH_OFFSET);
  referenceEarthGroup.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 8;

  const referenceEarthRotatingFrame = new THREE.Group();
  referenceEarthGroup.add(referenceEarthRotatingFrame);

  const geometry = new THREE.SphereGeometry(
    EARTH_RENDER_RADIUS_SCENE_UNITS,
    96,
    96,
  );
  geometry.computeTangents();

  const referenceEarth = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: {
        u_dayTexture: { value: textures.day },
        u_nightTexture: { value: textures.night },
        u_normalTexture: { value: textures.normal },
        u_specTexture: { value: textures.specular },
        u_cloudTexture: { value: textures.clouds },
        u_normalPower: { value: 5.0 },
        u_sunRelPosition: { value: sunRelativePosition.clone() },
        u_position: { value: REFERENCE_EARTH_OFFSET.clone() },
        u_moonPosition: { value: new THREE.Vector3(0, 0, 0) },
        u_moonRadius: { value: 0.0 },
        u_sunRadius: { value: 0.2 },
      },
      vertexShader: earthVertexShader,
      fragmentShader: EARTH_REFERENCE_FRAGMENT_SHADER,
    }),
  );
  referenceEarth.rotation.y = EARTH_BASE_ROTATION_Y;
  referenceEarth.castShadow = true;
  referenceEarth.receiveShadow = true;
  referenceEarthRotatingFrame.add(referenceEarth);

  const referenceAtmosphere = new THREE.Mesh(
    geometry.clone(),
    new THREE.ShaderMaterial({
      uniforms: {
        u_sunRelPosition: { value: sunRelativePosition.clone() },
        u_color: { value: sharedColor.clone() },
      },
      vertexShader: addonVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      side: THREE.BackSide,
      depthTest: true,
      depthWrite: false,
    }),
  );
  referenceAtmosphere.scale.setScalar(REFERENCE_EARTH_SCALE);
  referenceEarth.add(referenceAtmosphere);

  const referenceFresnel = new THREE.Mesh(
    geometry.clone(),
    new THREE.ShaderMaterial({
      uniforms: {
        u_sunRelPosition: { value: sunRelativePosition.clone() },
        u_color: { value: sharedColor.clone() },
      },
      vertexShader: addonVertexShader,
      fragmentShader: fresnelFragmentShader,
      transparent: true,
    }),
  );
  referenceFresnel.scale.setScalar(1.0001);
  referenceEarth.add(referenceFresnel);

  const referenceEarthLabel = createBodyLabelSprite("Reference Earth");
  referenceEarthLabel.position.set(0, EARTH_RENDER_RADIUS_SCENE_UNITS * 2.35, 0);
  referenceEarthLabel.visible = false;
  referenceEarthGroup.add(referenceEarthLabel);

  return {
    referenceEarthGroup,
    referenceEarthRotatingFrame,
    referenceEarth,
    referenceEarthLabel,
  };
}

function loadReferenceEarthTextures(loader: THREE.TextureLoader) {
  const tiffLoader = new TIFFLoader();

  const day = loadColorTexture(loader, earthDay2kUrl);
  const night = loadColorTexture(loader, earthNight2kUrl);
  const clouds = loadMaskTexture(loader, earthClouds2kUrl);
  const normal = loadDataTexture(tiffLoader, earthNormal2kUrl);
  const specular = loadDataTexture(tiffLoader, earthSpecular2kUrl);

  return {
    day,
    night,
    clouds,
    normal,
    specular,
  };
}

function loadColorTexture(loader: THREE.TextureLoader, url: string): THREE.Texture {
  const texture = loader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function loadMaskTexture(loader: THREE.TextureLoader, url: string): THREE.Texture {
  const texture = loader.load(url);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function loadDataTexture(loader: TIFFLoader, url: string): THREE.Texture {
  const texture = loader.load(url);
  texture.colorSpace = THREE.NoColorSpace;
  texture.flipY = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
