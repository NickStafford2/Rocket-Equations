import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createMissionCameraController } from "../mission-scene/camera/camera-controller";
import { createSceneObjects } from "./objects";
import { createThreeSceneBundle, type ThreeSceneBundle } from "./scene";
import { MissionSceneObjectsHost } from "./scene-objects-host";

export function SceneBundleBridge({
  onBundleChange,
}: {
  onBundleChange: (bundle: ThreeSceneBundle | null) => void;
}) {
  const { camera, gl, scene, size } = useThree();
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const [sceneObjects] = useState(createSceneObjects);

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
      objects: sceneObjects,
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
  }, [camera, gl, onBundleChange, scene, sceneObjects]);

  useEffect(() => {
    bundleRef.current?.resize(size.width, size.height);
  }, [size.height, size.width]);

  return <MissionSceneObjectsHost objects={sceneObjects} />;
}
