import { formatRelativeSpeed } from "../../mission";
import { SOFT_LANDING_SPEED } from "../../physics/bodies";
import { SoundtrackPanel } from "./SoundtrackPanel";

export function MissionOverview() {
  const landingTargetSpeed = formatRelativeSpeed(SOFT_LANDING_SPEED);
  return (
    <div className="mb-6 flex w-full flex-row justify-between border border-white/10 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex-flex-col">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
          To the Moon!
        </h1>
        <p>Goal: touch down below {landingTargetSpeed} Moon-relative speed.</p>
      </div>
      <SoundtrackPanel />
    </div>
  );
}
