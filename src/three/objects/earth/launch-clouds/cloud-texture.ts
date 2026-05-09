import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import whitePuffSpriteUrl from "../../../../assets/Sprites/whitePuff00.png";
import { CLOUD_TEXTURE_SIZE } from "./constants";

let cachedCloudTexture: THREE.Data3DTexture | null = null;
let cachedCloudSpriteTexture: THREE.Texture | null = null;

export function getCloudTexture(): THREE.Data3DTexture {
  if (cachedCloudTexture) {
    return cachedCloudTexture;
  }

  const size = CLOUD_TEXTURE_SIZE;
  const data = new Uint8Array(size * size * size);
  const perlin = new ImprovedNoise();

  let index = 0;

  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        data[index] = sampleCloudDensityByte({
          x,
          y,
          z,
          size,
          perlin,
        });

        index += 1;
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  cachedCloudTexture = texture;

  return texture;
}

export function getCloudSpriteTexture(): THREE.Texture {
  if (cachedCloudSpriteTexture) {
    return cachedCloudSpriteTexture;
  }

  const texture = new THREE.TextureLoader().load(whitePuffSpriteUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  cachedCloudSpriteTexture = texture;

  return texture;
}

function sampleCloudDensityByte({
  x,
  y,
  z,
  size,
  perlin,
}: {
  x: number;
  y: number;
  z: number;
  size: number;
  perlin: ImprovedNoise;
}): number {
  const u = x / (size - 1);
  const v = y / (size - 1);
  const w = z / (size - 1);

  const nx = u - 0.5;
  const nz = w - 0.5;
  const radialDistance = Math.sqrt(nx * nx + nz * nz);

  const horizontalMask =
    1 - THREE.MathUtils.smoothstep(0.3, 0.72, radialDistance);

  const lowerFalloff = THREE.MathUtils.smoothstep(0.08, 0.28, v);
  const upperFalloff = 1 - THREE.MathUtils.smoothstep(0.55, 0.95, v);
  const verticalMask = lowerFalloff * upperFalloff;

  const edgeMask =
    THREE.MathUtils.smoothstep(0.03, 0.16, u) *
    THREE.MathUtils.smoothstep(0.03, 0.16, 1 - u) *
    THREE.MathUtils.smoothstep(0.03, 0.16, w) *
    THREE.MathUtils.smoothstep(0.03, 0.16, 1 - w);

  const weather = 0.5 + 0.5 * perlin.noise(x * 0.028, 11.7, z * 0.028);
  const billow = 0.5 + 0.5 * perlin.noise(x * 0.05, y * 0.09, z * 0.05);
  const detail =
    0.5 + 0.5 * perlin.noise(x * 0.11 + 19.0, y * 0.2, z * 0.11 + 7.0);
  const wisps =
    0.5 + 0.5 * perlin.noise(x * 0.18 + 41.0, y * 0.31, z * 0.18 + 13.0);

  const rawDensity =
    horizontalMask *
    verticalMask *
    edgeMask *
    Math.max(weather - radialDistance * 0.55, 0) *
    (billow * 0.65 + detail * 0.25 + wisps * 0.1);

  const density = Math.pow(THREE.MathUtils.clamp(rawDensity, 0, 1), 1.35);

  return Math.floor(density * 255);
}
