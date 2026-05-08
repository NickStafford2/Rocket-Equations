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
  MOON_RENDER_RADIUS_SCENE_UNITS * 0.006;
const MOON_LANDING_SITE_ORIENTATION_OFFSET = Math.PI * 0.14;
const MOON_LANDING_SITE_MARKER_HEIGHT = MOON_RENDER_RADIUS_SCENE_UNITS * 0.55;
const MOON_LANDING_SITE_LABEL_HIDE_DISTANCE =
  MOON_RENDER_RADIUS_SCENE_UNITS * 2.1;
const MOON_LANDING_SITE_BEACON_RADIUS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 1.6;
const MOON_LANDING_SITE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xd5d0c4,
  emissive: 0x6a5d34,
  emissiveIntensity: 0.38,
  roughness: 0.92,
  metalness: 0.0,
});

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

  moon.add(createMoonLandingSiteAnchor());

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

function createMoonLandingSiteAnchor(): THREE.Group {
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
  anchor.add(createMoonLandingSiteMarker());

  void loadMoonLandingSiteModel()
    .then((model) => {
      anchor.add(model);
    })
    .catch((error) => {
      console.error("Failed to load Moon landing site model.", error);
    });

  return anchor;
}

function createMoonLandingSiteMarker(): THREE.Group {
  const marker = new THREE.Group();
  const markerWorldPosition = new THREE.Vector3();

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_LANDING_SITE_BEACON_RADIUS, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xfff17a,
      depthTest: false,
      depthWrite: false,
    }),
  );
  beacon.position.y = MOON_LANDING_SITE_MARKER_HEIGHT;
  beacon.renderOrder = 20;
  marker.add(beacon);

  const label = createBodyLabelSprite("Apollo 14 Site", {
    borderColor: "rgba(90, 242, 255, 0.95)",
  });
  label.position.set(0, MOON_LANDING_SITE_MARKER_HEIGHT + 2.3, 0);
  label.scale.set(12, 4.5, 1);
  marker.add(label);

  marker.onBeforeRender = (
    _renderer,
    _scene,
    camera,
  ) => {
    marker.getWorldPosition(markerWorldPosition);
    label.visible =
      camera.position.distanceTo(markerWorldPosition) >=
      MOON_LANDING_SITE_LABEL_HIDE_DISTANCE;
  };

  return marker;
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
