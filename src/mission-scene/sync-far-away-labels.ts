import * as THREE from "three";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
} from "../three/objects/constants";
import type { ThreeSceneBundle } from "../three/scene";

const CAMERA_DIRECTION = new THREE.Vector3();
const LABEL_WORLD_POSITION = new THREE.Vector3();

export function syncFarAwayLabels(bundle: ThreeSceneBundle) {
  const { camera, objects, renderer } = bundle;
  const viewportHeight = renderer.domElement.clientHeight;

  updateFarAwayLabel(
    objects.earthLabel,
    objects.earthGroup,
    camera,
    viewportHeight,
    EARTH_RENDER_RADIUS_SCENE_UNITS,
    EARTH_RENDER_RADIUS_SCENE_UNITS * 18,
    10,
    24,
    150,
  );

  updateFarAwayLabel(
    objects.moonLabel,
    objects.moon,
    camera,
    viewportHeight,
    MOON_RENDER_RADIUS_SCENE_UNITS,
    MOON_RENDER_RADIUS_SCENE_UNITS * 24,
    9,
    20,
    90,
  );
}

function updateFarAwayLabel(
  sprite: THREE.Sprite,
  anchor: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  viewportHeight: number,
  bodyRadius: number,
  showDistance: number,
  minScale: number,
  maxScale: number,
  maxScreenDiameterPx: number,
) {
  anchor.getWorldPosition(LABEL_WORLD_POSITION);
  const cameraDistance = camera.position.distanceTo(LABEL_WORLD_POSITION);
  camera.getWorldDirection(CAMERA_DIRECTION);
  const inFrontOfCamera =
    LABEL_WORLD_POSITION.sub(camera.position)
      .normalize()
      .dot(CAMERA_DIRECTION) > 0.1;
  const projectedDiameterPx =
    cameraDistance > 1e-6
      ? (bodyRadius /
          (cameraDistance *
            Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))) *
        viewportHeight
      : Number.POSITIVE_INFINITY;

  sprite.visible =
    cameraDistance >= showDistance &&
    inFrontOfCamera &&
    projectedDiameterPx <= maxScreenDiameterPx;
  if (!sprite.visible) return;

  const scale = THREE.MathUtils.clamp(
    cameraDistance * 0.05,
    minScale,
    maxScale,
  );
  sprite.scale.set(scale, scale * 0.375, 1);
}
