type MissionFrameLoopParams = {
  shouldRun: () => boolean;
  onFrame: (elapsedRealSeconds: number) => void;
};

type MissionFrameLoop = {
  requestRender: () => void;
  stop: () => void;
  dispose: () => void;
};

const MAX_REAL_FRAME_ELAPSED_SECONDS = 0.25;

export function createMissionFrameLoop({
  shouldRun,
  onFrame,
}: MissionFrameLoopParams): MissionFrameLoop {
  let animationFrameId: number | null = null;
  let disposed = false;
  let renderRequested = false;
  let previousFrameTimeMs: number | null = null;

  function stop() {
    if (animationFrameId === null) return;

    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    previousFrameTimeMs = null;
  }

  function start() {
    if (
      disposed ||
      document.visibilityState === "hidden" ||
      animationFrameId !== null
    ) {
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function requestRender() {
    renderRequested = true;
    start();
  }

  function frame(nowMs: number) {
    animationFrameId = null;

    const elapsedRealSeconds =
      previousFrameTimeMs === null
        ? 0
        : Math.min(
            (nowMs - previousFrameTimeMs) / 1000,
            MAX_REAL_FRAME_ELAPSED_SECONDS,
          );

    previousFrameTimeMs = nowMs;
    renderRequested = false;

    onFrame(elapsedRealSeconds);

    if (renderRequested || shouldRun()) {
      start();
      return;
    }

    previousFrameTimeMs = null;
  }

  return {
    requestRender,
    stop,
    dispose: () => {
      disposed = true;
      stop();
    },
  };
}
