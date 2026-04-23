import { formatRelativeSpeed } from "../../mission";
import { SOFT_LANDING_SPEED } from "../../physics/bodies";

export function MissionOverview() {
  const landingTargetSpeed = formatRelativeSpeed(SOFT_LANDING_SPEED);
  return (
    <div className="mb-6 w-full border border-white/10 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
      <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
        To the Moon!
      </h1>
      <p>Goal: touch down below {landingTargetSpeed} Moon-relative speed.</p>
    </div>
  );
}
