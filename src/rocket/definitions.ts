export type RocketModelVariant =
  | "saturn-v"
  | "apollo-soyuz"
  | "apollo-lunar-module";

export interface RocketModelSpec {
  name: string;
  heightMeters: number;
  contactOffsetMeters: number;
  plumeOffsetMeters: {
    x: number;
    y: number;
    z: number;
  };
  plumeScale: number;
}

export const ROCKET_MODEL_SPECS: Record<RocketModelVariant, RocketModelSpec> = {
  "saturn-v": {
    name: "Saturn V",
    heightMeters: 111,
    contactOffsetMeters: 55,
    plumeOffsetMeters: {
      x: 0,
      y: -62,
      z: 0,
    },
    plumeScale: 1,
  },
  "apollo-soyuz": {
    name: "Apollo Soyuz",
    heightMeters: 50,
    contactOffsetMeters: 24,
    plumeOffsetMeters: {
      x: 0,
      y: -30,
      z: 0,
    },
    plumeScale: 0.78,
  },
  "apollo-lunar-module": {
    name: "Apollo Lunar Module",
    heightMeters: 9,
    contactOffsetMeters: 4.6,
    plumeOffsetMeters: {
      x: 0,
      y: -4.2,
      z: 0,
    },
    plumeScale: 0.32,
  },
};
