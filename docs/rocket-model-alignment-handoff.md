# Rocket Model Alignment Handoff

## Problem

Imported rocket models are not visually aligned with the simulated rocket position.

In the running scene:

- the trail is correct
- the restored thrust-direction arrow is correct
- the imported rocket mesh appears displaced upward on the positive `y` axis
- the displacement is perpendicular to the Earth/Moon/Sun orbit plane
- The heading arrow and trail are correct;
- the imported rocket mesh moves in sync with the green arrow. when the left and right arrow keys on the keyboard are pressed, the rocket is supposed to only rotate around the y axis. when the arrow keys are pressed, it not only rotates on the y axis, but it also rotates around the green arrow.

I suspect The fix is to separate orientation, pivot, and scale into nested groups and compute the pivot only after applying the model’s orientation correction.

The rocket flies correctly in simulation, but the visible mesh is not sitting on the same point as the trail/arrow.

## Ground Truth Already Confirmed

- `objects.rocket.position` is correct
- the trail is correct
- the thrust-direction arrow is correct
- the mismatch is entirely in the imported model transform path

This was verified by restoring the heading arrow and comparing it directly against the trail and imported mesh.

## Assets Tested

These all showed the same bad visual offset:

- `src/assets/SaturnV.glb`
- `src/assets/Space Shuttle.glb`
- `src/assets/Proton Rocket/Proton.obj`

Important: the Proton OBJ came from a different source than the other models, but it landed in the same wrong place. That strongly suggests the bug is not specific to Poly Pizza and not specific to `glb` vs `obj`.

## Current Conclusion

The problem is in our import normalization / local transform assumptions in:

- `src/three/objects/rocket.ts`

It is not in:

- the simulation state
- trail generation
- scene sync of rocket position
