import type { getLaunchFrame, makeInitialRocketState } from "../physics/bodies";
import type { EarthMoonSimulation } from "../sim/simulation";

export type FrameState = {
  now: number;
  simState: ReturnType<EarthMoonSimulation["getState"]>;
  telemetry: ReturnType<EarthMoonSimulation["getTelemetry"]>;
  launchFrame: ReturnType<typeof getLaunchFrame>;
  previewState: ReturnType<typeof makeInitialRocketState>;
  aimArrowLength: number;
  stagedLaunchPreviewVisible: boolean;
};
