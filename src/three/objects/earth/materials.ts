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
