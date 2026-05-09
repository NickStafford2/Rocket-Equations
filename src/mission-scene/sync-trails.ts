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

export function syncPredictionDisplay({
  bundle,
  simulation,
  frame,
  running,
  showPrediction,
}: {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  frame: FrameState;
  running: boolean;
  showPrediction: boolean;
}) {
  bundle.objects.predictionLine.visible = showPrediction;

  if (!showPrediction) {
    return;
  }

  const sourceState = frame.stagedLaunchPreviewVisible
    ? {
        t: 0,
        position: frame.previewState.position,
        velocity: frame.previewState.velocity,
      }
    : {
        t: frame.simState.t,
        position: frame.simState.rocket.position,
        velocity: frame.simState.rocket.velocity,
      };

  const predictionUpdated = simulation.refreshPrediction(
    frame.now,
    sourceState,
    running,
  );
  const predictionLength = simulation.getPredictionLength();

  if (
    !predictionUpdated &&
    bundle.objects.predictionLine.geometry.drawRange.count === predictionLength
  ) {
    return;
  }

  const predictionPositions =
    bundle.objects.predictionLine.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
  const positionArray = predictionPositions.array as Float32Array;

  simulation.copyPredictionPositionsTo(
    positionArray,
    (target, offset, point) => {
      writeRenderPositionToArray(target, offset, frame.renderSpace, point);
    },
  );
  predictionPositions.needsUpdate = true;
  bundle.objects.predictionLine.geometry.setDrawRange(0, predictionLength);
}
