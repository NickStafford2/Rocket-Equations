import * as THREE from "three";
import type {
  OrientationIndicatorBundle,
  VectorIndicatorBundle,
} from "./orientation-indicator";

const INSET_PADDING_PX = 20;
const INSET_GAP_PX = 12;
const MAX_INSET_VIEWPORT_RATIO = 0.24;

type CreateIndicatorInsetRendererParams = {
  renderer: THREE.WebGLRenderer;
  orientationIndicator: OrientationIndicatorBundle;
  relativeVelocityIndicator: VectorIndicatorBundle;
};

export function createIndicatorInsetRenderer({
  renderer,
  orientationIndicator,
  relativeVelocityIndicator,
}: CreateIndicatorInsetRendererParams) {
  const rendererSize = new THREE.Vector2();

  function render() {
    renderer.getSize(rendererSize);

    const insetSize = getInsetSize(rendererSize, orientationIndicator.sizePx);
    const insetY = INSET_PADDING_PX;
    const orientationInsetX = Math.max(
      rendererSize.x - insetSize - INSET_PADDING_PX,
      0,
    );
    const relativeVelocityInsetX = Math.max(
      orientationInsetX - insetSize - INSET_GAP_PX,
      0,
    );

    const previousAutoClear = renderer.autoClear;

    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.setScissorTest(true);

    renderInset({
      renderer,
      scene: relativeVelocityIndicator.scene,
      camera: relativeVelocityIndicator.camera,
      x: relativeVelocityInsetX,
      y: insetY,
      size: insetSize,
    });

    renderInset({
      renderer,
      scene: orientationIndicator.scene,
      camera: orientationIndicator.camera,
      x: orientationInsetX,
      y: insetY,
      size: insetSize,
    });

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, rendererSize.x, rendererSize.y);
    renderer.autoClear = previousAutoClear;
  }

  return { render };
}

function getInsetSize(
  rendererSize: THREE.Vector2,
  preferredSizePx: number,
): number {
  return Math.min(
    preferredSizePx,
    Math.floor(
      Math.min(rendererSize.x, rendererSize.y) * MAX_INSET_VIEWPORT_RATIO,
    ),
  );
}

function renderInset({
  renderer,
  scene,
  camera,
  x,
  y,
  size,
}: {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  x: number;
  y: number;
  size: number;
}) {
  renderer.setViewport(x, y, size, size);
  renderer.setScissor(x, y, size, size);
  renderer.render(scene, camera);
}
