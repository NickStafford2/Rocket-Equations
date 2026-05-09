# Next Step

Goal: start the `react-three-fiber` scene-host migration without changing simulation ownership, HUD architecture, or render-space behavior.

What to do next:

- replace the manual Three.js bootstrap in `src/mission-scene/runtime.ts` and `src/three/scene.ts` with an `r3f` scene host
- keep simulation in `src/sim/` and `src/physics/`
- keep the main HUD in DOM React
- keep the current render-space layer as the source of render transforms
- do not switch camera controls yet unless it falls out naturally from the scene-host migration

Success criteria:

- the app renders through `r3f`
- current render modes still exist: `earth-local`, `moon-local`, `deep-space`
- current debug HUD still shows mode, anchor, projection, and origin
- no simulation logic moves into React rendering components

Important files to read first:

- `docs/rendering-roadmap.md`
- `src/render-space/frame.ts`
- `src/render-space/scene-position.ts`
- `src/mission-scene/sync-scene.ts`
- `src/mission-scene/sync-render-mode.ts`
- `src/mission-scene/runtime.ts`
- `src/three/scene.ts`
