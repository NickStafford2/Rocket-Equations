import * as THREE from "three";
import { writeRenderPositionToArray } from "../render-space/scene-position";
import type { ThreeSceneBundle } from "../three/scene";
import type { EarthMoonSimulation } from "../sim/simulation";
import type { FrameState } from "./frame-state";

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
