import * as THREE from "three";
import { EARTH_MOON_DISTANCE } from "../../../physics/bodies";
import type { RenderSpaceContext } from "../../../render-space/frame";
import { copyRenderPositionFromMeters } from "../../../render-space/scene-position";
import moonTextureUrl from "../../../assets/Nasa Moon/moon_color.png";
import moonNormalUrl from "../../../assets/Nasa Moon/moon_normal_clean2.png";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { createBodyLabelSprite } from "../labels";
import { createMoonOrbit } from "./moonOrbit";
import { createMoonLandingSiteAnchor } from "./moonLandingSite";
import { createSatelliteSystem } from "../earth/satellites";
import {
  MOON_SATELLITE_BODY,
  MOON_SATELLITE_DEFINITIONS,
} from "../earth/satellites/catalog";

const MOON_WORLD_ORIGIN = new THREE.Vector3();
const MOON_EARTH_DIRECTION = new THREE.Vector3();

const MOON_TEXTURE_ALIGNMENT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI * 1.55,
);

const MOON_SURFACE_SEGMENTS = 256;

type MoonVisualRootUserData = {
  focusLabel?: string;
  focusRadius?: number;
  cameraCollisionClearance?: number;
  moonRotatingFrame?: THREE.Group;
};

export function createMoonObjects(loader: THREE.TextureLoader) {
  const moonGroup = new THREE.Group();
  moonGroup.name = "moon";
  moonGroup.userData.focusLabel = "Moon";
  moonGroup.userData.focusRadius = MOON_RENDER_RADIUS_SCENE_UNITS;
  moonGroup.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;

  const moonRotatingFrame = new THREE.Group();
  moonRotatingFrame.name = "moon-rotating-frame";
  moonGroup.add(moonRotatingFrame);

  const moonSurface = createMoonSurfaceMesh(loader);
  moonRotatingFrame.add(moonSurface);

  const { anchor: moonLandingSiteAnchor, arrow: moonLandingSiteArrow } =
    createMoonLandingSiteAnchor();

  moonRotatingFrame.add(moonLandingSiteAnchor);

  const moonLabel = createBodyLabelSprite("Moon");
  moonLabel.position.set(0, MOON_RENDER_RADIUS_SCENE_UNITS * 3.25, 0);
  moonLabel.visible = false;
  moonGroup.add(moonLabel);

  const { satelliteSystem: moonSatelliteSystem } = createSatelliteSystem({
    name: "moon-satellite-system",
    body: {
      ...MOON_SATELLITE_BODY,
      renderRadiusSceneUnits: MOON_RENDER_RADIUS_SCENE_UNITS,
      targetSizeSceneUnits: 0.042,
    },
    definitions: MOON_SATELLITE_DEFINITIONS,
  });

  moonGroup.add(moonSatelliteSystem);

  const moonOrbit = createMoonOrbit();

  moonGroup.userData.moonRotatingFrame = moonRotatingFrame;

  syncMoonVisual(moonGroup, new THREE.Vector3(EARTH_MOON_DISTANCE, 0, 0));

  return {
    moon: moonGroup,
    moonGroup,
    moonRotatingFrame,
    moonSurface,
    moonLabel,
    moonSatelliteSystem,
    moonLandingSiteArrow,
    moonOrbit,
  };
}

export function syncMoonVisual(
  moon: THREE.Object3D,
  moonPositionMeters: THREE.Vector3,
  renderSpace?: RenderSpaceContext,
  earthRenderPosition: THREE.Vector3 = MOON_WORLD_ORIGIN,
) {
  if (renderSpace) {
    copyRenderPositionFromMeters(
      moon.position,
      renderSpace,
      moonPositionMeters,
    );
  } else {
    moon.position
      .copy(moonPositionMeters)
      .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  }

  syncMoonSurfaceOrientation(moon, earthRenderPosition);
}

function createMoonSurfaceMesh(loader: THREE.TextureLoader): THREE.Mesh {
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const moonNormal = loader.load(moonNormalUrl);
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.generateMipmaps = false;
  moonNormal.minFilter = THREE.LinearFilter;
  moonNormal.magFilter = THREE.LinearFilter;

  const moonSurface = new THREE.Mesh(
    new THREE.SphereGeometry(
      MOON_RENDER_RADIUS_SCENE_UNITS,
      MOON_SURFACE_SEGMENTS,
      MOON_SURFACE_SEGMENTS,
    ),
    new THREE.MeshStandardMaterial({
      color: 0xc2beb5,
      map: moonTexture,
      normalMap: moonNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 1.0,
      metalness: 0.0,
    }),
  );

  moonSurface.name = "moon-surface";
  moonSurface.castShadow = true;
  moonSurface.receiveShadow = true;

  return moonSurface;
}

function syncMoonSurfaceOrientation(
  moon: THREE.Object3D,
  earthRenderPosition: THREE.Vector3,
) {
  const userData = moon.userData as MoonVisualRootUserData;
  const moonRotatingFrame = userData.moonRotatingFrame;

  if (!moonRotatingFrame) {
    moon.lookAt(earthRenderPosition);
    moon.quaternion.multiply(MOON_TEXTURE_ALIGNMENT);
    return;
  }

  MOON_EARTH_DIRECTION.copy(earthRenderPosition).sub(moon.position);

  if (MOON_EARTH_DIRECTION.lengthSq() < 1e-12) {
    return;
  }

  moonRotatingFrame.quaternion.identity();
  moonRotatingFrame.lookAt(earthRenderPosition);
  moonRotatingFrame.quaternion.multiply(MOON_TEXTURE_ALIGNMENT);
}
