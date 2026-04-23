import { memo } from "react";
import { MissionTelemetryPanel } from "../mission-panels";
import type { TelemetryOverlayProps } from "./types";

export const TelemetryOverlay = memo(function TelemetryOverlay({
  elapsedMissionTime,
  currentSpeed,
  moonRelativeSpeed,
  earthAltitude,
  moonAltitude,
  status,
}: TelemetryOverlayProps) {
  return (
    <div className="pointer-events-auto inset-x-5 overflow-x-auto">
      <MissionTelemetryPanel
        elapsedMissionTime={elapsedMissionTime}
        currentSpeed={currentSpeed}
        moonRelativeSpeed={moonRelativeSpeed}
        earthAltitude={earthAltitude}
        moonAltitude={moonAltitude}
        status={status}
      />
    </div>
  );
});
