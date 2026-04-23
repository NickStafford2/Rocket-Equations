import { R_EARTH, R_MOON } from "../../physics/bodies";

export const DISTANCE_SCALE = 1 / 2_000_000;
const SCALE = 1;

export const EARTH_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * SCALE;
export const MOON_DRAW_RADIUS = R_MOON * DISTANCE_SCALE * SCALE;
export const ROCKET_DRAW_RADIUS = (R_EARTH * DISTANCE_SCALE * SCALE) / 100;
