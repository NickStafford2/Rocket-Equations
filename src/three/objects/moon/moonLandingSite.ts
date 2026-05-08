import * as THREE from "three";
import {
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { latLonToMoonLocalDirection } from "./moonMath";
import { loadMoonSurfaceFeatureModel } from "./moonSurfaceFeature";

const MOON_LOCAL_UP = new THREE.Vector3(0, 1, 0);

const APOLLO_14_LATITUDE_DEGREES = 0;
const APOLLO_14_LONGITUDE_DEGREES = 180;

const MOON_LANDING_SITE_SURFACE_LIFT_SCENE_UNITS =
  -MOON_RENDER_RADIUS_SCENE_UNITS * 0.003;

const MOON_LANDING_SITE_MARKER_HEIGHT = MOON_RENDER_RADIUS_SCENE_UNITS * 0.18;

const MOON_LANDING_SITE_ARROW_LENGTH = MOON_RENDER_RADIUS_SCENE_UNITS * 0.28;

const MOON_LANDING_SITE_ARROW_START_HEIGHT =
  MOON_LANDING_SITE_MARKER_HEIGHT + MOON_RENDER_RADIUS_SCENE_UNITS * 0.12;

const MOON_LANDING_SITE_BEACON_RADIUS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.05;

const MOON_LANDING_SITE_BEACON_COLOR = 0xd8d0a3;
const MOON_LANDING_SITE_ARROW_COLOR = 0x8fbcca;

const MOON_LANDING_SITE_ARROW_DIRECTION = new THREE.Vector3(0, -1, 0);

export function createMoonLandingSiteAnchor(): {
  anchor: THREE.Group;
  arrow: THREE.ArrowHelper;
} {
  const anchor = new THREE.Group();

  const surfaceNormal = latLonToMoonLocalDirection(
    APOLLO_14_LATITUDE_DEGREES,
    APOLLO_14_LONGITUDE_DEGREES,
  );

  anchor.position
    .copy(surfaceNormal)
    .multiplyScalar(
      MOON_RENDER_RADIUS_SCENE_UNITS +
        MOON_LANDING_SITE_SURFACE_LIFT_SCENE_UNITS,
    );

  anchor.quaternion.setFromUnitVectors(MOON_LOCAL_UP, surfaceNormal);

  const { marker, arrow } = createMoonLandingSiteMarker();
  anchor.add(marker);

  void loadMoonSurfaceFeatureModel()
    .then((feature) => {
      anchor.add(feature);
    })
    .catch((error) => {
      console.error("Failed to load Moon surface feature model.", error);
    });

  return { anchor, arrow };
}

function createMoonLandingSiteMarker(): {
  marker: THREE.Group;
  arrow: THREE.ArrowHelper;
} {
  const marker = new THREE.Group();

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_LANDING_SITE_BEACON_RADIUS, 18, 18),
    new THREE.MeshBasicMaterial({
      color: MOON_LANDING_SITE_BEACON_COLOR,
      transparent: true,
      opacity: 0.52,
      depthTest: false,
      depthWrite: false,
    }),
  );

  beacon.position.y = MOON_LANDING_SITE_MARKER_HEIGHT;
  beacon.renderOrder = 20;
  marker.add(beacon);

  const arrow = new THREE.ArrowHelper(
    MOON_LANDING_SITE_ARROW_DIRECTION,
    new THREE.Vector3(0, MOON_LANDING_SITE_ARROW_START_HEIGHT, 0),
    MOON_LANDING_SITE_ARROW_LENGTH,
    MOON_LANDING_SITE_ARROW_COLOR,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 5.4,
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 3.1,
  );

  arrow.renderOrder = 24;
  configureArrowOverlayMaterial(arrow.line.material);
  configureArrowOverlayMaterial(arrow.cone.material);

  marker.add(arrow);

  return { marker, arrow };
}

function configureArrowOverlayMaterial(
  material: THREE.Material | THREE.Material[],
) {
  const materials = Array.isArray(material) ? material : [material];

  for (const entry of materials) {
    const overlayMaterial = entry as THREE.Material & {
      color?: THREE.Color;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
      toneMapped?: boolean;
    };

    overlayMaterial.depthTest = false;
    overlayMaterial.depthWrite = false;
    overlayMaterial.transparent = true;
    overlayMaterial.opacity = 0.58;
    overlayMaterial.toneMapped = false;
    overlayMaterial.color?.setHex(MOON_LANDING_SITE_ARROW_COLOR);
  }
}
