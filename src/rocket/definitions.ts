export type RocketModelVariant =
  | "saturn-v"
  | "apollo-soyuz"
  | "apollo-lunar-module";

export interface RocketPhysicalModelSpec {
  name: string;
  heightMeters: number;
  surfaceContactOffsetMeters: number;
}

export interface RocketRenderModelSpec {
  nozzleLocalOffsetMeters: {
    x: number;
    y: number;
    z: number;
  };
  plumeVisualScaleMultiplier: number;
}

export const ROCKET_PHYSICAL_MODEL_SPECS: Record<
  RocketModelVariant,
  RocketPhysicalModelSpec
> = {
  "saturn-v": {
    name: "Saturn V",
    heightMeters: 111,
    surfaceContactOffsetMeters: 55,
  },
  "apollo-soyuz": {
    name: "Apollo Soyuz",
    heightMeters: 50,
    surfaceContactOffsetMeters: 24,
  },
  "apollo-lunar-module": {
    name: "Apollo Lunar Module",
    heightMeters: 9,
    surfaceContactOffsetMeters: 4.6,
  },
};

export const ROCKET_RENDER_MODEL_SPECS: Record<
  RocketModelVariant,
  RocketRenderModelSpec
> = {
  "saturn-v": {
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -62,
      z: 0,
    },
    plumeVisualScaleMultiplier: 1,
  },
  "apollo-soyuz": {
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -30,
      z: 0,
    },
    plumeVisualScaleMultiplier: 0.78,
  },
  "apollo-lunar-module": {
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -4.2,
      z: 0,
    },
    plumeVisualScaleMultiplier: 0.32,
  },
};
