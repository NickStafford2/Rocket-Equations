import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { CameraRigState, CameraRigTarget } from "../camera/camera-types";
import {
  updateFromControlsChange,
  updateFromControlsStart,
} from "../camera/camera-state";
import { pickCameraFocusTarget } from "../camera/camera-picking";
import type { ThreeSceneBundle } from "../../three/scene";

type BindMissionSceneEventsParams = {
  mount: HTMLDivElement;
  bundle: ThreeSceneBundle;
  cameraRigRef: MutableRefObject<CameraRigState>;
  setStatus: (value: string) => void;
  onFollowSelection: (target: CameraRigTarget) => void;
  onSyncCameraSelection: () => void;
  onControlsInteractionChange: (value: boolean) => void;
  requestRender: () => void;
  stopFrameLoop: () => void;
};

export function bindMissionSceneEvents({
  mount,
  bundle,
  cameraRigRef,
  setStatus,
  onFollowSelection,
  onSyncCameraSelection,
  onControlsInteractionChange,
  requestRender,
  stopFrameLoop,
}: BindMissionSceneEventsParams): () => void {
  const { camera, cameraController, renderer, scene } = bundle;
  const raycaster = new THREE.Raycaster();

  function onDoubleClick(event: MouseEvent) {
    const focusable = pickCameraFocusTarget({
      event,
      camera,
      scene,
      domElement: renderer.domElement,
      raycaster,
    });

    if (focusable) {
      onFollowSelection(focusable);
    }
  }

  function onScenePointerDown() {
    mount.focus({ preventScroll: true });
  }

  function onControlsStart() {
    onControlsInteractionChange(true);

    const status = updateFromControlsStart(cameraRigRef.current);
    if (status) {
      onSyncCameraSelection();
      setStatus(status);
    }

    requestRender();
  }

  function onControlsChange() {
    updateFromControlsChange(cameraRigRef.current, camera);
    requestRender();
  }

  function onControlsEnd() {
    onControlsInteractionChange(false);
    requestRender();
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      stopFrameLoop();
      return;
    }

    requestRender();
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  mount.addEventListener("pointerdown", onScenePointerDown);

  const detachCameraControlHandlers = cameraController.bindInteractionHandlers({
    onControlStart: onControlsStart,
    onControl: onControlsChange,
    onControlEnd: onControlsEnd,
    onUpdate: requestRender,
  });

  renderer.domElement.addEventListener("dblclick", onDoubleClick);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    mount.removeEventListener("pointerdown", onScenePointerDown);
    detachCameraControlHandlers();
    renderer.domElement.removeEventListener("dblclick", onDoubleClick);
  };
}
