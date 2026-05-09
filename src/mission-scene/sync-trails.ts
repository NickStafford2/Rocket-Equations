import * as THREE from "three";
import { TRAIL_POINT_CAPACITY } from "../sim/trail";
import { writeRenderPositionToArray } from "../render-space/scene-position";
import type { ThreeSceneBundle } from "../three/scene";
import type { EarthMoonSimulation } from "../sim/simulation";
import type { FrameState } from "./frame-state";
import type { MutableRefObject } from "react";

export function syncTrailDisplay({
  bundle,
  simulation,
  frame,
  showTrail,
  previousTrailLengthRef,
}: {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  frame: FrameState;
  showTrail: boolean;
  previousTrailLengthRef: MutableRefObject<number>;
}) {
  bundle.objects.trailLine.visible = showTrail;

  const trailLength = simulation.getTrailLength();
  const previousTrailLength = previousTrailLengthRef.current;
  const trailIsSlidingWindow =
    trailLength === TRAIL_POINT_CAPACITY &&
    previousTrailLength === TRAIL_POINT_CAPACITY;

  if (trailLength === previousTrailLength && !trailIsSlidingWindow) {
    return;
  }

  const startIndex =
    trailLength < previousTrailLength || trailIsSlidingWindow
      ? 0
      : previousTrailLength;
  const trailPositions = bundle.objects.trailLine.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const positionArray = trailPositions.array as Float32Array;

  simulation.copyTrailPositionsTo(
    positionArray,
    (target, offset, point) => {
      writeRenderPositionToArray(target, offset, frame.renderSpace, point);
    },
    startIndex,
  );
  trailPositions.needsUpdate = true;
  bundle.objects.trailLine.geometry.setDrawRange(0, trailLength);
  previousTrailLengthRef.current = trailLength;
}
