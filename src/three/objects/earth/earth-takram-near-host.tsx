import type { EarthTakramNearRendererBundle } from "./takram-near-renderer";

type EarthTakramNearHostProps = {
  renderer: EarthTakramNearRendererBundle;
};

export function EarthTakramNearHost({
  renderer,
}: EarthTakramNearHostProps) {
  return <primitive object={renderer.root} dispose={null} />;
}
