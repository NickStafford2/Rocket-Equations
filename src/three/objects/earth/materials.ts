import * as THREE from "three";
import { SUN_POSITION } from "../../sun";
import earthSurfaceFragmentShader from "./shaders/earth-surface.fragment.glsl?raw";
import earthSurfaceVertexShader from "./shaders/earth-surface.vertex.glsl?raw";
import type { EarthTextureSet } from "./textures";

export function createEarthSurfaceMaterial(
  textures: EarthTextureSet,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture: { value: textures.day },
      uNightTexture: { value: textures.night },
      uSunPosition: { value: SUN_POSITION.clone() },
      uNightStrength: { value: 1.5 },
      uTerminatorSoftness: { value: 0.16 },
    },
    vertexShader: earthSurfaceVertexShader,
    fragmentShader: earthSurfaceFragmentShader,
    toneMapped: true,
  });
}

export function createEarthCloudMaterial(
  textures: EarthTextureSet,
): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x18202c),
    emissiveIntensity: 0.2,
    alphaMap: textures.clouds,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
    shininess: 8,
  });
}
