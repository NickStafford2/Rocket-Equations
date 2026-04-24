import {
  EARTH_MOON_DISTANCE,
  EARTH_ROTATION_PERIOD,
  G,
  M_EARTH,
  R_EARTH,
} from "../../../physics/bodies";
import acrimSatModelUrl from "../../../assets/satellites/Active Cavity Irradiance Monitor Satellite (AcrimSAT) (A).glb?url";
import auraModelUrl from "../../../assets/satellites/Aura (B).glb?url";
import cassiniModelUrl from "../../../assets/satellites/Cassini-Huygens (A).glb?url";
import clementineModelUrl from "../../../assets/satellites/Clementine.glb?url";
import hubbleModelUrl from "../../../assets/satellites/Hubble Space Telescope (A).glb?url";
// import issModelUrl from "../../../assets/satellites/International Space Station (ISS).glb?url";
import jwstModelUrl from "../../../assets/satellites/James Webb Space Telescope (B).glb?url";
import tessModelUrl from "../../../assets/satellites/Transiting Exoplanet Survey Satellite (TESS) (B).glb?url";
import vanAllenModelUrl from "../../../assets/satellites/Van Allen Probes.glb?url";
import voyagerModelUrl from "../../../assets/satellites/Voyager Probe (A).glb?url";

export type SatelliteOrbitDefinition = {
  type: "geosynchronous" | "circular" | "earth-l2" | "deep-space";
  longitudeDeg?: number;
  altitudeMeters?: number;
  periodSeconds?: number;
  inclinationDeg?: number;
  ascendingNodeDeg?: number;
  phaseDeg?: number;
  direction?: 1 | -1;
  distanceMeters?: number;
  driftPeriodSeconds?: number;
};

export type SatelliteDefinition = {
  id: string;
  label: string;
  modelUrl: string;
  orbit: SatelliteOrbitDefinition;
};

export const SATELLITE_TARGET_SIZE_SCENE_UNITS = 0.42;

export const SATELLITE_DEFINITIONS: SatelliteDefinition[] = [
  {
    id: "acrimsat",
    label: "AcrimSAT",
    modelUrl: acrimSatModelUrl,
    orbit: {
      type: "geosynchronous",
      longitudeDeg: 128,
    },
  },
  {
    id: "aura",
    label: "Aura",
    modelUrl: auraModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 705_000,
      inclinationDeg: 98.2,
      ascendingNodeDeg: 18,
      phaseDeg: 34,
    },
  },
  {
    id: "cassini",
    label: "Cassini",
    modelUrl: cassiniModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 68_000_000,
      inclinationDeg: 17,
      ascendingNodeDeg: 228,
      phaseDeg: 142,
    },
  },
  {
    id: "clementine",
    label: "Clementine",
    modelUrl: clementineModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 92_000_000,
      inclinationDeg: 32,
      ascendingNodeDeg: 284,
      phaseDeg: 286,
    },
  },
  {
    id: "hubble",
    label: "Hubble",
    modelUrl: hubbleModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 540_000,
      inclinationDeg: 28.5,
      ascendingNodeDeg: 72,
      phaseDeg: 88,
    },
  },
  // {
  //   id: "iss",
  //   label: "ISS",
  //   modelUrl: issModelUrl,
  //   orbit: {
  //     type: "circular",
  //     altitudeMeters: 420_000,
  //     inclinationDeg: 51.6,
  //     ascendingNodeDeg: 12,
  //     phaseDeg: 218,
  //   },
  // },
  {
    id: "jwst",
    label: "JWST",
    modelUrl: jwstModelUrl,
    orbit: {
      type: "earth-l2",
      distanceMeters: 1_500_000_000,
    },
  },
  {
    id: "tess",
    label: "TESS",
    modelUrl: tessModelUrl,
    orbit: {
      type: "circular",
      periodSeconds: 13.7 * 24 * 3600,
      inclinationDeg: 40,
      ascendingNodeDeg: 156,
      phaseDeg: 18,
    },
  },
  {
    id: "van-allen",
    label: "Van Allen",
    modelUrl: vanAllenModelUrl,
    orbit: {
      type: "circular",
      periodSeconds: 9 * 3600,
      inclinationDeg: 11,
      ascendingNodeDeg: 318,
      phaseDeg: 248,
    },
  },
  {
    id: "voyager",
    label: "Voyager",
    modelUrl: voyagerModelUrl,
    orbit: {
      type: "deep-space",
      distanceMeters: EARTH_MOON_DISTANCE * 5.75,
      inclinationDeg: 24,
      longitudeDeg: 304,
      driftPeriodSeconds: 36 * 24 * 3600,
      phaseDeg: 0,
    },
  },
];

export function geosynchronousOrbitRadiusMeters(
  periodSeconds: number = EARTH_ROTATION_PERIOD,
): number {
  return Math.cbrt(G * M_EARTH * Math.pow(periodSeconds / (2 * Math.PI), 2));
}

export function orbitalRadiusMeters(orbit: SatelliteOrbitDefinition): number {
  if (orbit.altitudeMeters != null) {
    return R_EARTH + orbit.altitudeMeters;
  }

  if (orbit.periodSeconds != null) {
    return geosynchronousOrbitRadiusMeters(orbit.periodSeconds);
  }

  return geosynchronousOrbitRadiusMeters();
}
