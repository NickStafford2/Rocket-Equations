# Codex Task: Implement Local Physical Cloud Layer From Existing Earth Cloud Texture

## Goal

Read the current Three.js / React Three Fiber implementation and implement a hybrid Earth cloud system.

The app already has an 8K Earth cloud texture rendered as a transparent sphere around Earth. That texture looks fine from orbit, but it looks flat and unrealistic when the rocket is near the surface or flying through clouds.

Use the existing 8K cloud texture as the global visual cloud layer and as the source of truth for where clouds exist. Add a near-surface/local physical cloud layer that appears around the rocket/camera when the rocket is inside or near the cloud altitude range.

## Important Existing Context

Look through the current project files first.

Also inspect the examples in:

```txt
examples/
```

Use those examples as guidance for implementation style and patterns.

Do not rewrite the whole rendering system unless necessary. Adapt the existing Earth/cloud code.

## Desired Behavior

From orbit:

- Keep the current 8K cloud shell visible around Earth.
- It should still look like a normal Earth cloud texture from space.

Near the surface / inside the atmosphere:

- The cloud layer should no longer feel like a flat transparent sphere.
- When the rocket flies into an area where the 8K cloud texture has clouds, local cloud/fog/cloud-puff detail should appear around the rocket.
- When the rocket is over a clear area in the 8K cloud texture, local clouds should be minimal or absent.
- The transition between global cloud shell and local cloud layer should be smooth.

## Core Strategy

Use the 8K cloud texture as a coverage mask.

Create or load a smaller CPU-readable density version of the same cloud texture, for example:

```txt
clouds_density_1024.png
```

This should be generated from the same image as the 8K cloud texture so the cloud coverage aligns.

For each frame or at a throttled interval:

1. Get the rocket or camera world position.
2. Convert that world position into Earth-relative normalized coordinates.
3. Convert that point into equirectangular UV coordinates.
4. Sample the density map at that UV.
5. Use the sampled cloud density to control how much local cloud detail appears.

Conceptually:

```txt
8K cloud texture = visual cloud map from orbit
1024 density texture = CPU/cloud-coverage lookup
local cloud field = physical fly-through cloud illusion
```

## Implementation Goals

Add a cloud system with these pieces if they do not already exist:

```txt
EarthCloudSystem
  GlobalCloudShell
  CloudCoverageSampler
  LocalCloudField
```

### GlobalCloudShell

Responsible for the existing 8K cloud sphere.

Requirements:

- Use the existing 8K cloud texture.
- Keep it visible from orbit.
- It can slowly rotate if the current app already does that.
- It should remain cheap.

### CloudCoverageSampler

Responsible for sampling the downscaled cloud density map.

Requirements:

- Load a small image such as `clouds_density_1024.png`.
- Read its pixels using a canvas.
- Expose a function like:

```ts
sampleAtWorldPosition(position: THREE.Vector3): number
```

- Return a value from `0` to `1`.
- `0` means clear sky.
- `1` means dense cloud coverage.

Use equirectangular mapping:

```ts
const longitude = Math.atan2(p.z, p.x);
const latitude = Math.asin(p.y);

const u = 0.5 + longitude / (2 * Math.PI);
const v = 0.5 - latitude / Math.PI;
```

Adjust axes if the current Earth texture orientation differs.

### LocalCloudField

Responsible for the physical/fly-through cloud illusion near the rocket.

First implementation can be simple and performant:

- Use instanced cloud sprites, billboards, or lightweight transparent planes.
- Center the cloud field around the rocket or camera.
- Only show it when:
  - rocket altitude is within the cloud layer range, and
  - sampled cloud density is above a threshold.
- Fade opacity smoothly based on altitude and density.
- Avoid hundreds of separate React components if possible; prefer `InstancedMesh`.

Acceptable first version:

```txt
localOpacity = altitudeFade * smoothstep(cloudDensityThreshold, 1.0, sampledDensity)
```

## Altitude Behavior

Do not show local clouds everywhere.

Use an altitude band:

```txt
cloudBottomAltitude
cloudTopAltitude
```

Fade local clouds in near the bottom/middle of this range and fade them out near the top.

The exact values should be tuned to the current Earth scale.

## Performance Requirements

- Do not raymarch the entire planet.
- Do not load a full 32K cloud texture into the browser as one texture.
- Do not create thousands of independent React mesh components.
- Use the global 8K shell for distant visuals.
- Use local instanced clouds only near the rocket/camera.
- Keep the density map small enough for CPU sampling.

## Visual Requirements

The goal is not to exactly recreate every pixel of the 8K cloud map up close.

The goal is:

```txt
global texture controls WHERE clouds are
local procedural/instanced system controls HOW clouds look up close
```

The local clouds should feel volumetric, soft, and fly-through-able.

If possible, add:

- random scale variation
- soft alpha cloud sprite texture
- altitude fade
- distance fade
- slight noise variation
- reduced visibility/fog while inside dense cloud regions

## Suggested File/Asset Additions

Possible new files:

```txt
src/.../clouds/EarthCloudSystem.tsx
src/.../clouds/GlobalCloudShell.tsx
src/.../clouds/CloudCoverageSampler.ts
src/.../clouds/LocalCloudField.tsx
```

Possible new assets:

```txt
public/textures/earth/clouds_density_1024.png
public/textures/clouds/cloud_puff.png
```

Use the existing asset paths and project conventions where appropriate.

## Definition of Done

- The current 8K Earth cloud shell still works from orbit.
- The app samples cloud coverage from a downscaled version of the same cloud texture.
- Local clouds appear near the rocket/camera only where the global cloud map says clouds exist.
- Local clouds fade based on altitude.
- The rocket can fly through cloud-like volume near the surface/atmosphere.
- The implementation is performant enough for real-time use.
- Existing examples in `examples/` were reviewed and used to match project style.

do not use react three fiber. this was used as an example.
