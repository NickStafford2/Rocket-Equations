import * as THREE from "three";
import { EARTH_ROTATION_PERIOD } from "../../../physics/bodies";
import {
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS,
} from "../constants";
import { loadEarthTextureVariants } from "./textures";
import { createBodyLabelSprite } from "../labels";
import { createSatelliteSystem } from "./satellites";
import {
  EARTH_SATELLITE_BODY,
  EARTH_SATELLITE_DEFINITIONS,
} from "./satellites/catalog";
import { createEarthFarRenderer } from "./far-renderer";
import {
  createEarthNearAtmosphereRenderer,
  type EarthNearAtmosphereRendererBundle,
} from "./near-atmosphere-renderer";
import type { EarthFarRendererBundle } from "./far-renderer";

export type EarthRenderers = {
  far: EarthFarRendererBundle;
  nearAtmosphere: EarthNearAtmosphereRendererBundle;
};

export function createEarthObjects(loader: THREE.TextureLoader) {
  const textures = loadEarthTextureVariants(loader);

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_RENDER_RADIUS_SCENE_UNITS;
  earthGroup.userData.cameraCollisionClearance =
    REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 12;
  const earthRotatingFrame = new THREE.Group();

  const far = createEarthFarRenderer(textures);
  const nearAtmosphere = createEarthNearAtmosphereRenderer(textures);

  const earthLabel = createBodyLabelSprite("Earth");
  earthLabel.position.set(0, EARTH_RENDER_RADIUS_SCENE_UNITS * 2.35, 0);
  earthLabel.visible = false;

  const { satelliteSystem } = createSatelliteSystem({
    body: {
      ...EARTH_SATELLITE_BODY,
      renderRadiusSceneUnits: EARTH_RENDER_RADIUS_SCENE_UNITS,
      defaultOrbitPeriodSeconds: EARTH_ROTATION_PERIOD,
    },
    definitions: EARTH_SATELLITE_DEFINITIONS,
  });

  return {
    earthGroup,
    earthRotatingFrame,
    earth: far.globe,
    earthCloudsFrame: nearAtmosphere.cloudsFrame,
    earthAtmosphere: nearAtmosphere.atmosphere,
    earthFresnel: nearAtmosphere.fresnel,
    earthLabel,
    renderers: {
      far,
      nearAtmosphere,
    },
    satelliteSystem,
  };
}
