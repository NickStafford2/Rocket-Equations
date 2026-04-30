export type RocketModelVariant =
  | "saturn-v"
  | "apollo-soyuz"
  | "apollo-lunar-module";

export interface RocketModelSpec {
  name: string;
  heightMeters: number;
  surfaceContactOffsetMeters: number;
  nozzleLocalOffsetMeters: {
    x: number;
    y: number;
    z: number;
  };
  plumeVisualScaleMultiplier: number;
}

export const ROCKET_PHYSICAL_MODEL_SPECS: Record<
  RocketModelVariant,
  RocketModelSpec
> = {
  "saturn-v": {
    name: "Saturn V",
    heightMeters: 111,
    surfaceContactOffsetMeters: 55,
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -62,
      z: 0,
    },
    plumeVisualScaleMultiplier: 1,
  },
  "apollo-soyuz": {
    name: "Apollo Soyuz",
    heightMeters: 50,
    surfaceContactOffsetMeters: 24,
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -30,
      z: 0,
    },
    plumeVisualScaleMultiplier: 0.78,
  },
  "apollo-lunar-module": {
    name: "Apollo Lunar Module",
    heightMeters: 9,
    surfaceContactOffsetMeters: 4.6,
    nozzleLocalOffsetMeters: {
      x: 0,
      y: -4.2,
      z: 0,
    },
    plumeVisualScaleMultiplier: 0.32,
  },
};
