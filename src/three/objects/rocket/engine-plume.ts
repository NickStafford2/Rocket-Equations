// engine-plume.ts

import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

export function createEnginePlume(): THREE.Mesh {
  const radius = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.34;
  const height = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 2.8;

  const geometry = new THREE.ConeGeometry(radius, height, 18, 1, true);

  // ShaderMaterial for dynamic flame effect
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color(0xffc857) },
      tipColor: { value: new THREE.Color(0xff5733) },
      height: { value: height },
    },
    vertexShader: `
      uniform float time;
      uniform float height;
      varying float vY;
      void main() {
        vY = position.y + (height / 2.0); // 0 at base, height at tip
        // Slight wobble along x/z
        float wave = sin(time * 5.0 + position.y * 5.0) * 0.05 * (1.0 - vY / height);
        vec3 pos = position;
        pos.x += wave;
        pos.z += wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 tipColor;
      uniform float height;
      varying float vY;
      void main() {
        float alpha = 1.0 - (vY / height); // fade out toward tip
        vec3 color = mix(baseColor, tipColor, vY / height);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const plume = new THREE.Mesh(geometry, material);

  plume.rotation.z = Math.PI;
  plume.position.y = -REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.25;
  plume.visible = false;

  // Update function to animate plume
  plume.userData.update = (delta: number) => {
    material.uniforms.time.value += delta;
  };

  return plume;
}
