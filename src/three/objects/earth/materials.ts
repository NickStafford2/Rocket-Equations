import * as THREE from "three";
import { SUN_POSITION } from "../../sun";
import earthAtmosphereFragmentShader from "./shaders/earth-atmosphere.fragment.glsl?raw";
import earthAtmosphereVertexShader from "./shaders/earth-atmosphere.vertex.glsl?raw";
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
      uCloudTexture: { value: textures.clouds },
      uNormalTexture: { value: textures.normal },
      uSpecularTexture: { value: textures.specular },
      uSunPosition: { value: SUN_POSITION.clone() },
      uNormalScale: { value: 0.85 },
      uCloudOpacity: { value: 0.42 },
    },
    vertexShader: earthSurfaceVertexShader,
    fragmentShader: earthSurfaceFragmentShader,
    toneMapped: true,
  });
}

export function createEarthAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunPosition: { value: SUN_POSITION.clone() },
      uDayColor: { value: new THREE.Color(0x5ea7ff) },
      uTwilightColor: { value: new THREE.Color(0x2f6cff) },
    },
    vertexShader: earthAtmosphereVertexShader,
    fragmentShader: earthAtmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    toneMapped: true,
  });
}
