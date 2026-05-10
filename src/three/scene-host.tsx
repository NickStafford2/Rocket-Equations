import { Canvas } from "@react-three/fiber";
import type { ThreeSceneBundle } from "./scene";
import { SceneBundleBridge } from "./SceneBundleBridge";

type MissionSceneCanvasProps = {
  className?: string;
  onBundleChange: (bundle: ThreeSceneBundle | null) => void;
};

export function MissionSceneCanvas({
  className,
  onBundleChange,
}: MissionSceneCanvasProps) {
  return (
    <Canvas
      className={className}
      frameloop="always"
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      dpr={window.devicePixelRatio}
      camera={{
        fov: 55,
        near: 0.0005,
        far: 10000,
        position: [-840, 480, 840],
        up: [0, 1, 0],
      }}
    >
      <SceneBundleBridge onBundleChange={onBundleChange} />
    </Canvas>
  );
}
