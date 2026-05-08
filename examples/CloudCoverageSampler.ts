import * as THREE from "three";

export type CloudCoverageSampler = {
  sampleAtWorldPosition: (worldPosition: THREE.Vector3) => number;
  sampleAtUV: (u: number, v: number) => number;
  isReady: () => boolean;
};

export function createCloudCoverageSampler(
  imageUrl: string,
  earthCenter = new THREE.Vector3(0, 0, 0),
): CloudCoverageSampler {
  let ready = false;
  let width = 0;
  let height = 0;
  let pixels: Uint8ClampedArray | null = null;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageUrl;

  image.onload = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create 2D canvas context for cloud sampler.");
    }

    width = image.width;
    height = image.height;

    canvas.width = width;
    canvas.height = height;

    context.drawImage(image, 0, 0);

    pixels = context.getImageData(0, 0, width, height).data;
    ready = true;
  };

  function sampleAtWorldPosition(worldPosition: THREE.Vector3): number {
    if (!ready || !pixels) return 0;

    const localPosition = worldPosition.clone().sub(earthCenter).normalize();
    const { u, v } = worldPositionToEarthUV(localPosition);

    return sampleAtUV(u, v);
  }

  function sampleAtUV(u: number, v: number): number {
    if (!ready || !pixels) return 0;

    const wrappedU = ((u % 1) + 1) % 1;
    const clampedV = THREE.MathUtils.clamp(v, 0, 1);

    const x = Math.floor(wrappedU * (width - 1));
    const y = Math.floor(clampedV * (height - 1));

    const index = (y * width + x) * 4;

    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;
    const a = pixels[index + 3] ?? 255;

    const brightness = (r + g + b) / 3 / 255;
    const alpha = a / 255;

    return brightness * alpha;
  }

  return {
    sampleAtWorldPosition,
    sampleAtUV,
    isReady: () => ready,
  };
}

export function worldPositionToEarthUV(normalizedPosition: THREE.Vector3) {
  const p = normalizedPosition.clone().normalize();

  const longitude = Math.atan2(p.z, p.x);
  const latitude = Math.asin(p.y);

  const u = 0.5 + longitude / (2 * Math.PI);
  const v = 0.5 - latitude / Math.PI;

  return { u, v };
}
