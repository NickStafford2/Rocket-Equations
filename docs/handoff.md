# Handoff

Goal: continue decoupling simulation logic from rendering logic.

Current direction:
- Simulation should own physical state, time stepping, thrust, staging rules, contact logic, and telemetry inputs.
- Rendering should read simulation state and turn it into visuals, camera behavior, model swaps, labels, and effects.
- Avoid mixing visual scale hacks or asset-placement rules into physics code.

Best place to start:
- Audit `src/mission-scene/sync-scene.ts` and identify logic that is not purely visual.
- Keep `src/sim/` and `src/physics/` free of Three.js scene concerns.
- Keep `src/three/objects/` focused on asset creation and visual helpers.
- Move object-specific visual behavior into dedicated helpers, similar to `syncMoonVisual(...)`.

Practical next steps:
- Split scene syncing into smaller focused modules:
  - celestial body sync
  - rocket visual sync
  - trail/prediction sync
  - UI sync
- Introduce small shared definition modules where data belongs in one place, instead of duplicating constants across scene and simulation code.
- Keep the runtime loop simple:
  - advance simulation from elapsed real time
  - sync visuals from simulation state
  - render

What not to do yet:
- Do not add a general event bus.
- Do not build one giant scene manager.
- Do not move simulation decisions into render code just because the visuals need tuning.

Rule of thumb:
- If a value affects physics outcomes, it belongs in simulation/physics definitions.
- If a value only affects what the user sees, it belongs in rendering/scene code.
