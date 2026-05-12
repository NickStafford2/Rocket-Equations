# Render Coordinate Strategy

This note explains:

- how the project handles camera, origin, and scale today
- why that model is awkward for true-scale Earth rendering and Takram integration
- what to replace it with

## Current system

Today the project uses a hybrid render-space model.

### 1. Simulation coordinates

Simulation state is kept in physical units:

- positions in meters
- orbital distances in meters
- Earth and Moon radii in meters

This part is good and should stay the same.

### 2. Render-space modes

Rendering switches between different modes:

- `earth-local`
- `moon-local`
- `deep-space`

These modes choose:

- which body is the active anchor
- whether to render with a body-scaled projection or an origin-rebased linear projection
- how world positions are converted into scene positions

### 3. Current scaling model

The current renderer does **not** use true scale in scene space.

Instead, it uses a custom visual scale:

- planet radii are multiplied into a hand-tuned scene size
- orbital distances use a different conversion factor
- near-body views use a "body surface scaled" projection

This means the rendered Earth is not simply "Earth in kilometers" or "Earth in meters." It is a custom visual representation designed to look reasonable across very different distances.

### 4. Camera behavior

The camera is free to follow different targets:

- rocket
- Earth
- Moon
- overview positions

So the camera is not conceptually tied to the rocket.

### 5. Why this feels confusing

The current system mixes several ideas:

- physical coordinates for simulation
- custom visual coordinates for rendering
- body-relative scaling for near-body scenes
- origin rebasing only in some cases

That works for a handcrafted hybrid renderer, but it becomes awkward when trying to integrate systems that expect a more physical local frame.

## Why this is awkward for Takram

Takram atmosphere and clouds are designed around a geospatial Earth model.

They work best when:

- Earth is effectively at true scale
- the active local scene is near a rebased origin
- world coordinates are interpreted as a local frame for ECEF/Earth geometry

The current body-scaled render space does not match that well.

The main issue is not React Three Fiber. The issue is that the current scene space is a visual abstraction, while Takram expects a more physical near-Earth frame.

## Recommended replacement

Replace the current body-scaled render space with a floating-origin render model.

### Core idea

Keep simulation in meters, but render in kilometers using a floating origin.

- simulation: meters
- floating origin: meters
- rendering: kilometers

Example:

```ts
const METERS_TO_RENDER_UNITS = 1 / 1000

function metersToRenderUnits(meters: number) {
  return meters * METERS_TO_RENDER_UNITS
}
```

In this model:

- `1 render unit = 1 kilometer`
- Earth radius is about `6378`
- Moon distance is about `384400`

Those are large values, but manageable if the scene is rebased around the current view.

## Recommended camera/origin model

Do **not** define the origin from the rocket alone.

The camera can look at different things, so the floating origin should be driven by the current view context.

The better rule is:

- simulation camera can be anywhere in physical space
- render origin is chosen from the current camera/focus context
- render camera stays at or near `0,0,0`
- all scene objects are rendered relative to that origin

This does **not** mean the camera is logically fixed in the simulation.

It means:

- the simulation still knows the true camera position
- the renderer subtracts the chosen origin before drawing
- the visual result is the same
- the numerical stability is much better

## Why "camera near origin" is better than "camera can be anywhere"

Mathematically, these two views can represent the same scene:

1. put the camera far away in world coordinates
2. move the world so the camera is near the origin

Visually they can match, but numerically they are not equivalent.

Keeping the rendered camera near the origin improves:

- floating-point precision
- matrix math stability
- shader world/view position calculations
- depth precision
- shadow behavior
- local atmosphere and cloud effects

This is the main reason to rebase.

## Recommended render modes

Keep multiple render modes, but change what they mean.

### Earth-local

Use a local Earth frame for:

- launch
- ascent
- atmospheric flight
- low Earth orbit
- Takram atmosphere and clouds
- future land tiling

Suggested behavior:

- origin chosen from camera or active focus near Earth
- Earth rendered at true scale in kilometers
- Takram used only in this mode

### Moon-local

Use the same idea around the Moon for:

- approach
- landing
- local surface rendering

### Deep-space

Use a simpler floating-origin linear frame for:

- Earth-Moon transit
- far-body visualization
- custom distant shaders

Suggested behavior:

- origin chosen from camera or active focus
- no fake body-surface scaling
- keep Earth and Moon as distant bodies in kilometer units

## What should stay the same

These parts should remain:

- simulation in meters
- physics independent from rendering
- camera modes and target selection
- separate Earth-local / Moon-local / deep-space visual systems

## What should change

These parts should change:

- remove the current body-surface-scaled render projection
- stop using custom non-physical scene scaling as the main coordinate model
- rebase all rendering around a floating origin
- render scene positions in kilometers
- keep the rendered camera at or near the origin

## Logarithmic depth buffer

`logarithmicDepthBuffer` can still help, but it should be treated as optional support, not the foundation of the design.

Use floating origin first.

If depth precision is still not good enough for some extreme views, then test logarithmic depth after the new coordinate system is in place.

## Recommendation summary

The recommended direction is:

1. keep simulation in meters
2. choose a floating render origin from the current camera/focus context
3. subtract that origin from all rendered positions
4. convert the rebased positions from meters to kilometers
5. keep the rendered camera near `0,0,0`
6. use Takram only for the Earth-local near-field renderer
7. keep your own custom shaders for far Earth, deep space, and Moon transit

This is simpler, more physically coherent, and a much better base for Takram atmosphere, Takram clouds, and later Earth surface tiling.
