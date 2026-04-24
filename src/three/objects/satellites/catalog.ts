import { EARTH_ROTATION_PERIOD, G, M_EARTH } from "../../../physics/bodies";
import acrimSatModelUrl from "../../../assets/satellites/Active Cavity Irradiance Monitor Satellite (AcrimSAT) (A).glb?url";

export type SatelliteOrbitDefinition = {
  type: "geosynchronous";
  longitudeDeg: number;
  periodSeconds?: number;
};

export type SatelliteDefinition = {
  id: string;
  label: string;
  modelUrl: string;
  targetSizeSceneUnits: number;
  orbit: SatelliteOrbitDefinition;
};

export const SATELLITE_DEFINITIONS: SatelliteDefinition[] = [
  {
    id: "acrimsat",
    label: "AcrimSAT",
    modelUrl: acrimSatModelUrl,
    targetSizeSceneUnits: 0.42,
    orbit: {
      type: "geosynchronous",
      longitudeDeg: 128,
    },
  },
];

export function geosynchronousOrbitRadiusMeters(
  periodSeconds: number = EARTH_ROTATION_PERIOD,
): number {
  return Math.cbrt(
    G * M_EARTH * Math.pow(periodSeconds / (2 * Math.PI), 2),
  );
}
