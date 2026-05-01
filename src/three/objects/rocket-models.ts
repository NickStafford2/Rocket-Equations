import apolloLunarModuleUrl from "../../assets/Rocket Sections/Apollo Lunar Module3.glb?url";
import apolloSoyuzUrl from "../../assets/Rocket Sections/Apollo Soyuz6.glb?url";
import saturnVModelUrl from "../../assets/Rocket Sections/Saturn V3.glb?url";
import {
  ROCKET_PHYSICAL_MODEL_SPECS,
  ROCKET_RENDER_MODEL_SPECS,
  type RocketPhysicalModelSpec,
  type RocketRenderModelSpec,
  type RocketModelVariant,
} from "../../rocket/definitions";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "./constants";

export type { RocketModelVariant } from "../../rocket/definitions";

export interface RocketModelDefinition
  extends RocketPhysicalModelSpec,
    RocketRenderModelSpec {
  url: string;
}

const SATURN_V_HEIGHT_METERS =
  ROCKET_PHYSICAL_MODEL_SPECS["saturn-v"].heightMeters;
const SATURN_V_RENDER_HEIGHT_SCENE_UNITS =
  REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 8.6;

export const ROCKET_VISUAL_METERS_TO_SCENE_UNITS =
  SATURN_V_RENDER_HEIGHT_SCENE_UNITS / SATURN_V_HEIGHT_METERS;

export const ROCKET_RENDER_MODEL_DEFINITIONS: Record<
  RocketModelVariant,
  RocketModelDefinition
> = {
  "saturn-v": {
    url: saturnVModelUrl,
    ...ROCKET_PHYSICAL_MODEL_SPECS["saturn-v"],
    ...ROCKET_RENDER_MODEL_SPECS["saturn-v"],
  },
  "apollo-soyuz": {
    url: apolloSoyuzUrl,
    ...ROCKET_PHYSICAL_MODEL_SPECS["apollo-soyuz"],
    ...ROCKET_RENDER_MODEL_SPECS["apollo-soyuz"],
  },
  "apollo-lunar-module": {
    url: apolloLunarModuleUrl,
    ...ROCKET_PHYSICAL_MODEL_SPECS["apollo-lunar-module"],
    ...ROCKET_RENDER_MODEL_SPECS["apollo-lunar-module"],
  },
};
