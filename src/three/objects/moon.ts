import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EARTH_MOON_DISTANCE } from "../../physics/bodies";
import moonTextureUrl from "../../assets/Nasa Moon/moon_color.png";
import moonNormalUrl from "../../assets/Nasa Moon/moon_normal_clean2.png";
import moonLandingSiteUrl from "../../assets/MoonSurface/Apollo 14 - Landing Site.glb?url";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "./constants";
import { createBodyLabelSprite } from "./labels";

const MOON_WORLD_ORIGIN = new THREE.Vector3();
const MOON_LOCAL_UP = new THREE.Vector3(0, 1, 0);
const MOON_TEXTURE_ALIGNMENT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI * 1.55,
);
const APOLLO_14_LATITUDE_DEGREES = 0;
const APOLLO_14_LONGITUDE_DEGREES = 180;
const MOON_LANDING_SITE_TARGET_FOOTPRINT_SCENE_UNITS =
  MOON_RENDER_RADIUS_SCENE_UNITS * 0.024;
const MOON_LANDING_SITE_SURFACE_LIFT_SCENE_UNITS =
  MOON_RENDER_RADIUS_SCENE_UNITS * 0.0012;
const MOON_LANDING_SITE_ORIENTATION_OFFSET = Math.PI * 0.14;
const MOON_LANDING_SITE_MARKER_HEIGHT = MOON_RENDER_RADIUS_SCENE_UNITS * 0.18;
const MOON_LANDING_SITE_ARROW_LENGTH = MOON_RENDER_RADIUS_SCENE_UNITS * 0.28;
const MOON_LANDING_SITE_ARROW_START_HEIGHT =
  MOON_LANDING_SITE_MARKER_HEIGHT + MOON_RENDER_RADIUS_SCENE_UNITS * 0.12;
const MOON_LANDING_SITE_BEACON_RADIUS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.05;
const MOON_LANDING_SITE_BEACON_COLOR = 0xd8d0a3;
const MOON_LANDING_SITE_ARROW_COLOR = 0x8fbcca;
const MOON_LANDING_SITE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xbdb5a4,
  emissive: 0x231c10,
  emissiveIntensity: 0.08,
  roughness: 0.96,
  metalness: 0.0,
});
const MOON_LANDING_SITE_ARROW_DIRECTION = new THREE.Vector3(0, -1, 0);

let moonLandingSitePromise: Promise<THREE.Group> | null = null;

export function createMoonObjects(loader: THREE.TextureLoader) {
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const moonNormal = loader.load(moonNormalUrl);
  moonNormal.colorSpace = THREE.NoColorSpace;
  moonNormal.generateMipmaps = false;
  moonNormal.minFilter = THREE.LinearFilter;
  moonNormal.magFilter = THREE.LinearFilter;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RENDER_RADIUS_SCENE_UNITS, 256, 256),
    new THREE.MeshStandardMaterial({
      color: 0xc2beb5,
      map: moonTexture,
      normalMap: moonNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 1.0,
      metalness: 0.0,
    }),
  );
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.userData.focusLabel = "Moon";
  moon.userData.focusRadius = MOON_RENDER_RADIUS_SCENE_UNITS;
  moon.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
  syncMoonVisual(moon, new THREE.Vector3(EARTH_MOON_DISTANCE, 0, 0));

  const { anchor: moonLandingSiteAnchor, arrow: moonLandingSiteArrow } =
    createMoonLandingSiteAnchor();
  moon.add(moonLandingSiteAnchor);

  const moonLabel = createBodyLabelSprite("Moon");
  moonLabel.position.set(0, MOON_RENDER_RADIUS_SCENE_UNITS * 3.25, 0);
  moonLabel.visible = false;
  moon.add(moonLabel);

  const moonOrbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 512; i += 1) {
    const theta = (i / 512) * Math.PI * 2;
    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * ORBIT_METERS_TO_SCENE_UNITS,
        0,
        EARTH_MOON_DISTANCE * Math.sin(theta) * ORBIT_METERS_TO_SCENE_UNITS,
      ),
    );
  }

  const moonOrbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5f82,
      transparent: true,
      opacity: 0.7,
    }),
  );

  return {
    moon,
    moonLabel,
    moonLandingSiteArrow,
    moonOrbit,
  };
}

export function syncMoonVisual(
  moon: THREE.Mesh,
  moonPositionMeters: THREE.Vector3,
) {
  moon.position
    .copy(moonPositionMeters)
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  moon.lookAt(MOON_WORLD_ORIGIN);
  moon.quaternion.multiply(MOON_TEXTURE_ALIGNMENT);
}

function createMoonLandingSiteAnchor(): {
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

  void loadMoonLandingSiteModel()
    .then((model) => {
      anchor.add(model);
    })
    .catch((error) => {
      console.error("Failed to load Moon landing site model.", error);
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

function loadMoonLandingSiteModel(): Promise<THREE.Group> {
  if (moonLandingSitePromise) {
    return moonLandingSitePromise.then((model) => model.clone(true));
  }

  const loader = new GLTFLoader();
  moonLandingSitePromise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      moonLandingSiteUrl,
      (gltf) => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const footprintMeters = Math.max(size.x, size.z, 1e-6);
        const scale =
          MOON_LANDING_SITE_TARGET_FOOTPRINT_SCENE_UNITS / footprintMeters;

        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) {
            return;
          }

          mesh.material = MOON_LANDING_SITE_MATERIAL.clone();
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -bounds.min.y * scale,
          -center.z * scale,
        );
        model.rotation.y = MOON_LANDING_SITE_ORIENTATION_OFFSET;

        resolve(model);
      },
      undefined,
      reject,
    );
  });

  return moonLandingSitePromise.then((model) => model.clone(true));
}

function latLonToMoonLocalDirection(
  latitudeDegrees: number,
  longitudeDegrees: number,
): THREE.Vector3 {
  const latitudeRadians = THREE.MathUtils.degToRad(latitudeDegrees);
  const longitudeRadians = THREE.MathUtils.degToRad(longitudeDegrees);
  const cosLatitude = Math.cos(latitudeRadians);

  return new THREE.Vector3(
    -cosLatitude * Math.cos(longitudeRadians),
    Math.sin(latitudeRadians),
    cosLatitude * Math.sin(longitudeRadians),
  ).normalize();
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
