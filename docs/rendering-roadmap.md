# Rendering Roadmap

Goal: evolve this app from a single manual Three.js scene into a scalable hybrid renderer that can support:

- Earth launch and atmospheric flight
- Deep-space travel
- Moon approach and landing
- Different rendering strategies depending on camera context
- Adjustable trail and prediction rendering in local coordinate frames
- Better reuse of common `r3f`/`drei` patterns without letting rendering own simulation

This document is for future LLM sessions. It explains the desired end state, the migration order, and the rules that should constrain implementation choices.

## Core idea

The long-term architecture should be:

- simulation in stable physical coordinates
- rendering in context-dependent local coordinates
- `react-three-fiber` as the rendering shell
- `drei` as a helper library, not the engine
- DOM React for the main HUD
- custom planet, tiling, shader, and trail systems where project-specific behavior is required

The project should move toward a KSP-like hybrid renderer:

- near Earth: render local Earth surface context, atmosphere, launch assets, local trails
- far from Earth: render Earth as a distant planet with cheaper shaders
- near Moon: render local Moon surface context and landing visuals
- far from Moon: render Moon as a distant body with cheaper shaders
- all of the above should read the same simulation state

## What success looks like

When this roadmap is complete, the app should be able to:

- keep simulation logic independent from view scale, origin rebasing, and camera mode
- switch rendering frames without corrupting physics state
- render rocket, trails, predictions, labels, and terrain in the correct local frame
- use separate Earth and Moon render pipelines for near and far views
- support performance-aware quality tiers and shader swaps
- make it easier to adopt common `r3f` examples for controls, loaders, scene composition, and debugging

## Non-goals

Do not do these early:

- do not move the main HUD into the 3D canvas
- do not rewrite simulation to fit React
- do not force `drei` abstractions to define planet architecture
- do not add globe tiling before coordinate separation is clean
- do not add multiple advanced effects at once before performance instrumentation exists

## Why `r3f`

Use `react-three-fiber` because this project is becoming a rendering application with multiple modes and subsystems, not just a single handcrafted scene.

`r3f` is useful here for:

- scene composition
- resource lifecycle
- isolated renderer modules
- easier reuse of common community patterns
- integration of performance and debug helpers
- cleaner migration from one rendering strategy to another

Do not use `r3f` because it magically improves graphics. It does not. The graphics quality will come from custom shaders, LOD, tiling, coordinate strategy, and asset pipelines.

## Why not move the HUD into `r3f`

Keep the main HUD in DOM React.

Reasons:

- it is already working
- DOM UI is easier to style and maintain
- canvas UI does not help the hybrid planet renderer
- the camera control migration does not require a canvas-based HUD

Use `drei/Html` only for world-anchored labels or small diegetic overlays inside the 3D scene.

## Recommended dependency posture

Recommended:

- `@react-three/fiber`
- `@react-three/drei`
- `camera-controls` directly or through `drei` once the scene is in `r3f`
- optional `zustand` if shared render state becomes awkward

Use carefully:

- postprocessing passes
- heavy atmospheric effects
- SSR and volumetrics

Do not depend on:

- random copied shader packs without understanding them
- `drei` components as substitutes for custom planet logic

## Architectural rules

Future changes should follow these rules:

1. Simulation state must remain the source of truth.
2. Render-space transforms must be derived from simulation state, never the reverse.
3. Physics units must remain stable even if render origin and render scale change.
4. Trails and predictions must support multiple render spaces.
5. Earth and Moon near/far rendering should be explicit systems, not one shader with many conditionals.
6. Performance instrumentation must be introduced before expensive visual upgrades.
7. New rendering systems should be modular and removable.

## Target architecture

The desired layers are:

### 1. Simulation layer

Owns:

- orbital state
- body positions in physical coordinates
- rocket dynamics
- thrust and maneuver inputs
- mission telemetry
- predicted future states

Does not know about:

- Three.js objects
- `r3f`
- local render origin
- shader mode
- tile LOD

Likely home:

- `src/sim/`
- `src/physics/`

### 2. Render-space layer

This is the most important new layer.

It should own:

- active render frame selection
- local origin rebasing
- conversion from physical coordinates to render coordinates
- separate local frames for Earth vicinity, Moon vicinity, and deep space
- trail and prediction resampling into the chosen render space

This layer should answer questions like:

- what body or region is the current visual anchor
- where is the render origin this frame
- should the rocket be shown in Earth-local, Moon-local, or barycentric space
- which prediction points remain meaningful in the current frame

Suggested future home:

- `src/render-space/`

### 3. Renderer layer

This should become the `r3f` shell and visual composition layer.

It should own:

- canvas setup
- camera integration
- scene graph composition
- render passes
- quality tiers
- performance monitors
- body-specific renderer modules

Suggested future home:

- `src/render/`
- `src/render/scene/`
- `src/render/camera/`
- `src/render/perf/`

### 4. Domain renderers

These are custom modules for each major visual context.

Expected renderer families:

- Earth far renderer
- Earth near-atmosphere renderer
- Moon far renderer
- Moon near-surface renderer
- rocket renderer
- trail renderer
- prediction renderer
- label/indicator renderer

These modules should consume render-space outputs and simulation snapshots.

## Rendering modes to support

At minimum, design for these modes:

### Earth local mode

Use when camera or rocket is near Earth.

Should support:

- better atmospheric shading
- local terrain or surface representation later
- launch structures
- local rocket trails
- local prediction display

### Earth distant mode

Use when Earth is viewed from far away.

Should support:

- cheaper globe rendering
- cheaper cloud and atmosphere treatment
- no local terrain detail

### Moon local mode

Use when camera or rocket is near Moon.

Should support:

- local landing context
- better near-surface shading
- landing guides and local trails

### Moon distant mode

Use when Moon is viewed as a remote body.

Should support:

- cheaper body rendering
- no near-surface detail

### Deep-space transit mode

Use when neither Earth-local nor Moon-local rendering should dominate.

Should support:

- stable large-scale visualization
- low-cost body rendering
- mission trajectory readability

## Migration plan

This work should be done in phases. Do not collapse them into one rewrite.

### Phase 1: finish separation between simulation and visual sync

Intent:

- make the existing code easier to migrate without breaking behavior

Tasks:

- keep reducing mixed concerns in `src/mission-scene/`
- ensure simulation outputs are explicit and render-friendly
- make trail and prediction data easier to consume as snapshots rather than mutating scene structures

Definition of done:

- scene sync is visual only
- simulation can be read without understanding Three.js internals

### Phase 2: introduce render-space abstractions in the current renderer

Intent:

- create the conceptual seam before adopting `r3f`

Tasks:

- add a render-space module that converts physical positions to render positions
- choose an active render frame based on camera and rocket context
- route rocket, bodies, trails, and predictions through this layer

Definition of done:

- at least one object path uses render-space transforms instead of raw scene-space assumptions
- trails and predictions can be offset or rebased intentionally

### Phase 3: migrate the scene host to `r3f`

Intent:

- adopt `r3f` as the rendering shell without changing app behavior

Tasks:

- keep simulation and HUD outside the canvas
- replace manual scene bootstrapping with `Canvas`
- move scene assembly into `r3f` components
- preserve current visual behavior first

Definition of done:

- app renders through `r3f`
- feature parity with current camera, lighting, scene objects, and updates

### Phase 4: migrate camera controls

Intent:

- replace manual `OrbitControls` usage with `CameraControls`

Tasks:

- move camera integration into a dedicated camera module
- connect camera mode and selection state to render state cleanly
- preserve overview, lock, look-at, and camera debug behavior

Definition of done:

- camera behavior works in `r3f`
- no DOM HUD rewrite is required

### Phase 5: split near/far body renderers

Intent:

- make Earth and Moon rendering context-sensitive

Tasks:

- create separate near/far Earth renderer modules
- create separate near/far Moon renderer modules
- switch between them based on render context
- avoid giant all-in-one materials and conditionals

Definition of done:

- Earth and Moon each have explicit near/far visual pipelines

### Phase 6: add performance instrumentation and quality tiers

Intent:

- make expensive features measurable and controllable

Tasks:

- add frame timing and scene stats
- use `drei` `PerformanceMonitor` or equivalent render metrics
- define quality tiers for atmosphere, clouds, trails, post, and shadow settings
- degrade gracefully rather than dropping frames unpredictably

Definition of done:

- quality changes can be driven by measured performance

### Phase 7: start terrain/tiling work

Intent:

- add high-detail local rendering after the architecture can support it

Tasks:

- prototype Earth local tiling independently from Moon local tiling
- keep near-surface tiling separate from distant globe rendering
- ensure tile coordinates integrate with render-space rebasing

Definition of done:

- tiling can be introduced without touching simulation logic

## Suggested code organization

This is a target, not a mandatory immediate refactor.

```text
src/
  sim/
  physics/
  render-space/
    frame.ts
    origin.ts
    transforms.ts
    trails.ts
    predictions.ts
  render/
    canvas/
    camera/
    perf/
    scene/
    bodies/
      earth/
        far/
        near/
      moon/
        far/
        near/
      rocket/
    effects/
  ui/
```

## Rules for trails and predictions

Trails and predictions are a core design pressure in this app. They should not be treated as afterthoughts.

Requirements:

- store source data in physical coordinates
- project into render coordinates per active render frame
- allow different sampling density for local and distant contexts
- support multiple visual policies:
  - local trail emphasis
  - orbital arc emphasis
  - prediction truncation or decimation when rebasing changes relevance

Avoid:

- hard-coding trail buffers to one world origin assumption
- mixing simulation prediction generation with scene buffer mutation

## Shader strategy

Use separate shader strategies for separate contexts.

Recommended pattern:

- Earth near atmosphere: more expensive atmospheric and cloud treatment
- Earth distant: cheaper globe and atmosphere
- Moon near: more detailed surface and lighting response
- Moon distant: cheaper body shading

Do not try to make one material handle all contexts if that creates fragile branching and tuning problems.

## Performance strategy

Performance should be designed, not debugged late.

Minimum expectations:

- measure frame time
- know which systems are active
- expose a small quality tier model
- make expensive effects optional or mode-specific

Good first targets for adaptation:

- atmosphere sample count
- cloud quality
- shadow resolution
- trail point density
- prediction point density
- postprocessing toggles

## Immediate next steps

The next few Codex sessions should focus on this order:

1. Document current scene assumptions that depend on one fixed origin.
2. Create a small `render-space` module with explicit transform helpers.
3. Route one subsystem through it first:
   - rocket position
   - or trail rendering
4. After that seam is working, plan the `r3f` scene-host migration.
5. Only then migrate controls and more advanced rendering features.

## Guidance for future LLM sessions

When continuing this roadmap:

- prefer incremental migrations over rewrites
- preserve working behavior while moving boundaries
- do not move the HUD into the canvas
- do not put simulation logic inside `r3f` components
- do not start terrain tiling before render-space abstractions are real
- treat `drei` as a helper library, not as architecture

When choosing the next task, prioritize:

- cleaner separations
- render-space infrastructure
- maintainable camera architecture
- measurable performance infrastructure

## Current repo realities

At time of writing:

- the app still uses a manual Three.js runtime in `src/mission-scene/` and `src/three/`
- camera controls are still manual `OrbitControls`
- the HUD is DOM-based and should remain that way
- the most important missing architecture layer is render-space separation between simulation and rendering

That is the real bottleneck. Solve that first, then use `r3f` to scale the renderer cleanly.
