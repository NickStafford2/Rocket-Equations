import apolloLunarModuleUrl from "../../assets/Rocket Sections/Apollo Lunar Module3.glb?url";
import apolloSoyuzUrl from "../../assets/Rocket Sections/Apollo Soyuz6.glb?url";
import saturnVModelUrl from "../../assets/Rocket Sections/Saturn V3.glb?url";
import {
  ROCKET_MODEL_SPECS,
  type RocketModelSpec,
  type RocketModelVariant,
} from "../../rocket/definitions";
import { ROCKET_DRAW_RADIUS } from "./constants";

export type { RocketModelVariant } from "../../rocket/definitions";

export interface RocketModelDefinition extends RocketModelSpec {
  url: string;
}

const SATURN_V_HEIGHT_METERS = ROCKET_MODEL_SPECS["saturn-v"].heightMeters;
const SATURN_V_TARGET_SIZE = ROCKET_DRAW_RADIUS * 8.6;

export const ROCKET_SCENE_SCALE = SATURN_V_TARGET_SIZE / SATURN_V_HEIGHT_METERS;

export const ROCKET_MODEL_DEFINITIONS: Record<
  RocketModelVariant,
  RocketModelDefinition
> = {
  "saturn-v": {
    url: saturnVModelUrl,
    ...ROCKET_MODEL_SPECS["saturn-v"],
  },
  "apollo-soyuz": {
    url: apolloSoyuzUrl,
    ...ROCKET_MODEL_SPECS["apollo-soyuz"],
  },
  "apollo-lunar-module": {
    url: apolloLunarModuleUrl,
    ...ROCKET_MODEL_SPECS["apollo-lunar-module"],
  },
};
