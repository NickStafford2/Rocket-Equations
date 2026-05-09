# Camera Handoff

Goal: replace the current camera behavior with an explicit camera system based on typed targets, typed modes, and reference frames instead of growing more `userData` flags and runtime exceptions.

## Why

The current camera works, but behavior is spread across:
- `src/three/camera-rig.ts`
- `src/mission-scene/runtime.ts`
- object `userData` fields like `focusLabel`, `focusRadius`, `followMinDistance`, `cameraCollisionClearance`

This makes it easy to patch behavior, but harder to evolve the camera cleanly.

The main missing feature is a better launch/landing camera:
- when near Earth or Moon, "down" should be defined by the center of the active body
- the camera should orbit naturally around the rocket/lander in that body-relative frame

## Recommended design

Build a small camera system with 3 explicit concepts:

1. `CameraTarget`
- typed camera target object
- avoid stringly-typed scene lookups as the main API
- fields should include:
  - `id`
  - `kind`
  - `object`
  - `radius`
  - `anchor` getter
  - `cameraProfile`

2. `CameraMode`
- use a real mode/state model
- suggested first modes:
  - `overview`
  - `free`
  - `inertialFollow`
  - `bodyOrbit`
  - `surfaceApproach`

3. `CameraFrame`
- explicit reference frame for each mode
- suggested frames:
  - `inertial`
  - `bodyLocal`

## Important mode: `bodyOrbit`

This is the mode that should handle launch and landing.

Behavior:
- target is the rocket or lander
- active body is Earth or Moon
- "up" = normalized vector from body center to vehicle
- "down" = toward body center
- camera offset should be stored as orbit parameters in that local frame, not as a raw world-space offset

Suggested basis each frame:
- `up = normalize(vehiclePosition - bodyCenter)`
- `right = stable tangent axis`
- `forward = cross(right, up)`

Use yaw/pitch/radius in that frame to reconstruct camera position every update.

This should make launch/landing views feel surface-relative instead of space-relative.

## Recommended implementation shape

Suggested new area:
- `src/camera/targets.ts`
- `src/camera/modes.ts`
- `src/camera/frames.ts`
- `src/camera/profiles.ts`
- `src/camera/controller.ts`

Suggested top-level API:
- `setMode(mode)`
- `setTarget(target)`
- `setReferenceBody(body)`

## Practical guidance

- Keep Three.js.
- It is fine to keep `OrbitControls` initially, but do not keep adding special cases to the current camera rig.
- If smoother transitions are needed, consider `camera-controls` for interpolation/dolly/framing, but keep frame selection and mode logic in app code.
- Move away from camera policy living in object `userData`.
- Keep clip-plane policy separated from camera mode logic.

## Good migration order

1. Introduce typed `CameraTarget` objects for Earth, Moon, Sun, Rocket.
2. Replace `focusLabel`-driven camera selection with target registration.
3. Extract camera modes into a controller separate from `mission-scene/runtime.ts`.
4. Implement `bodyOrbit` for rocket/lander near Earth/Moon.
5. Keep existing `overview` and free camera working during transition.
6. Remove old camera-rig exceptions only after `bodyOrbit` is stable.

## Existing useful files

- `src/three/camera-rig.ts`
- `src/mission-scene/camera.ts`
- `src/mission-scene/runtime.ts`
- `src/mission-scene/camera-clip-planes.ts`
- `src/three/objects/rocket/camera-profile.ts`

These contain useful policy and tuning, but should not remain the long-term architecture.
