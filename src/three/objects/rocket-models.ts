import apolloLunarModuleUrl from "../../assets/Rocket Sections/Apollo Lunar Module3.glb?url";
import apolloSoyuzUrl from "../../assets/Rocket Sections/Apollo Soyuz6.glb?url";
import saturnVModelUrl from "../../assets/Rocket Sections/Saturn V3.glb?url";
import { ROCKET_DRAW_RADIUS } from "./constants";

export type RocketModelVariant =
  | "saturn-v"
  | "apollo-soyuz"
  | "apollo-lunar-module";

export interface RocketModelDefinition {
  name: string;
  url: string;
  heightMeters: number;
}

const SATURN_V_HEIGHT_METERS = 111;
const SATURN_V_TARGET_SIZE = ROCKET_DRAW_RADIUS * 8.6;

export const ROCKET_SCENE_SCALE = SATURN_V_TARGET_SIZE / SATURN_V_HEIGHT_METERS;

export const ROCKET_MODEL_DEFINITIONS: Record<
  RocketModelVariant,
  RocketModelDefinition
> = {
  "saturn-v": {
    url: saturnVModelUrl,
    name: "Saturn V",
    heightMeters: SATURN_V_HEIGHT_METERS,
  },
  "apollo-soyuz": {
    url: apolloSoyuzUrl,
    name: "Apollo Soyuz",
    heightMeters: 50,
  },
  "apollo-lunar-module": {
    url: apolloLunarModuleUrl,
    name: "Apollo Lunar Module",
    heightMeters: 9,
  },
};
