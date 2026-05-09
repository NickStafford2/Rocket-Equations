import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createMissionCameraController } from "./camera-controller";
import {
  createThreeSceneBundle,
  type ThreeSceneBundle,
} from "./scene";

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
      frameloop="never"
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

function SceneBundleBridge({
  onBundleChange,
}: {
  onBundleChange: (bundle: ThreeSceneBundle | null) => void;
}) {
  const { camera, gl, scene, size } = useThree();
  const bundleRef = useRef<ThreeSceneBundle | null>(null);

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const cameraController = createMissionCameraController({
      camera: perspectiveCamera,
      domElement: gl.domElement,
    });
    const bundle = createThreeSceneBundle({
      scene,
      camera: perspectiveCamera,
      renderer: gl,
      cameraController,
    });

    bundleRef.current = bundle;
    onBundleChange(bundle);
    return () => {
      if (bundleRef.current === bundle) {
        bundleRef.current = null;
      }
      onBundleChange(null);
      bundle.dispose();
    };
  }, [camera, gl, onBundleChange, scene]);

  useEffect(() => {
    bundleRef.current?.resize(size.width, size.height);
  }, [size.height, size.width]);

  return null;
}
