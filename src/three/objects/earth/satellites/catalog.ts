import {
  EARTH_MOON_DISTANCE,
  EARTH_ROTATION_PERIOD,
  G,
  M_EARTH,
  M_MOON,
  R_EARTH,
  R_MOON,
} from "../../../../physics/bodies";
import acrimSatModelUrl from "../../../../assets/satellites/satellite_ACIMS_lod0.glb?url";
import auraModelUrl from "../../../../assets/satellites/satellite_Aura_lod0.glb?url";
import cassiniModelUrl from "../../../../assets/satellites/satellite_CassiniHuygens_lod0.glb?url";
import clementineModelUrl from "../../../../assets/satellites/satellite_Clementine_lod0.glb?url";
import hubbleModelUrl from "../../../../assets/satellites/satellite_Hubble_lod0.glb?url";
// import issModelUrl from "../../../../assets/satellites/satellite_ISS_lod0.glb?url";
import jwstModelUrl from "../../../../assets/satellites/satellite_JWST_lod0.glb?url";
import lroModelUrl from "../../../../assets/satellites/satellite_LunarReconnaissanceOrbiter_lod0.glb?url";
import tessModelUrl from "../../../../assets/satellites/satellite_TESS_lod0.glb?url";
import vanAllenModelUrl from "../../../../assets/satellites/satellite_VanAllen_lod0.glb?url";
import voyagerModelUrl from "../../../../assets/satellites/satellite_Voyager_lod0.glb?url";

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

type EarthSatelliteTemplate = {
  id: string;
  label: string;
  modelUrl: string;
  orbit: SatelliteOrbitDefinition;
  instanceCount?: number;
};

type MoonSatelliteTemplate = {
  id: string;
  label: string;
  modelUrl: string;
  orbit: Required<
    Pick<
      SatelliteOrbitDefinition,
      | "type"
      | "altitudeMeters"
      | "inclinationDeg"
      | "ascendingNodeDeg"
      | "phaseDeg"
    >
  > &
    Pick<SatelliteOrbitDefinition, "direction">;
};

export const SATELLITE_TARGET_SIZE_SCENE_UNITS = 0.42;
const LEO_MIN_ALTITUDE_METERS = 420_000;
const LEO_CLUSTER_MAX_ALTITUDE_METERS = 1_850_000;
const MEO_CLUSTER_MAX_ALTITUDE_METERS = 24_000_000;

const EARTH_SATELLITE_TEMPLATES: EarthSatelliteTemplate[] = [
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
    instanceCount: 12,
    orbit: {
      type: "circular",
      altitudeMeters: 1_500_000_000 - R_EARTH,
      inclinationDeg: 5.2,
      ascendingNodeDeg: 210,
      phaseDeg: 12,
    },
  },
  {
    id: "tess",
    label: "TESS",
    modelUrl: tessModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters:
        geosynchronousOrbitRadiusMeters(M_EARTH, 13.7 * 24 * 3600) - R_EARTH,
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
      altitudeMeters:
        geosynchronousOrbitRadiusMeters(M_EARTH, 9 * 3600) - R_EARTH,
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
      type: "circular",
      altitudeMeters: EARTH_MOON_DISTANCE * 5.75 - R_EARTH,
      inclinationDeg: 24,
      ascendingNodeDeg: 304,
      phaseDeg: 0,
    },
  },
];

export const EARTH_SATELLITE_DEFINITIONS: SatelliteDefinition[] =
  EARTH_SATELLITE_TEMPLATES.flatMap((template, templateIndex) =>
    Array.from({ length: template.instanceCount ?? 200 }, (_, index) => ({
      id: `${template.id}-${index + 1}`,
      label: `${template.label} ${index + 1}`,
      modelUrl: template.modelUrl,
      orbit: expandEarthOrbit(template.orbit, index, templateIndex),
    })),
  );

export function geosynchronousOrbitRadiusMeters(
  primaryMassKg: number,
  periodSeconds: number,
): number {
  return Math.cbrt(
    G * primaryMassKg * Math.pow(periodSeconds / (2 * Math.PI), 2),
  );
}

export function orbitalRadiusMeters(
  orbit: SatelliteOrbitDefinition,
  bodyRadiusMeters: number,
  primaryMassKg: number,
  defaultPeriodSeconds?: number,
): number {
  if (orbit.altitudeMeters != null) {
    return bodyRadiusMeters + orbit.altitudeMeters;
  }

  if (orbit.periodSeconds != null) {
    return geosynchronousOrbitRadiusMeters(primaryMassKg, orbit.periodSeconds);
  }

  return geosynchronousOrbitRadiusMeters(
    primaryMassKg,
    defaultPeriodSeconds ?? EARTH_ROTATION_PERIOD,
  );
}

const MOON_SATELLITE_TEMPLATES: MoonSatelliteTemplate[] = [
  {
    id: "lro",
    label: "LRO",
    modelUrl: lroModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 220_000,
      inclinationDeg: 86.5,
      ascendingNodeDeg: 24,
      phaseDeg: 42,
    },
  },
  {
    id: "clementine",
    label: "Clementine",
    modelUrl: clementineModelUrl,
    orbit: {
      type: "circular",
      altitudeMeters: 420_000,
      inclinationDeg: 112,
      ascendingNodeDeg: 148,
      phaseDeg: 214,
      direction: -1,
    },
  },
];

export const MOON_SATELLITE_DEFINITIONS: SatelliteDefinition[] =
  MOON_SATELLITE_TEMPLATES.flatMap((template, templateIndex) =>
    Array.from({ length: 10 }, (_, index) => ({
      id: `${template.id}-${index + 1}`,
      label: `${template.label} ${index + 1}`,
      modelUrl: template.modelUrl,
      orbit: {
        ...template.orbit,
        altitudeMeters:
          template.orbit.altitudeMeters +
          index * 18_000 +
          templateIndex * 9_000,
        ascendingNodeDeg:
          (template.orbit.ascendingNodeDeg + index * 37 + templateIndex * 11) %
          360,
        phaseDeg:
          (template.orbit.phaseDeg + index * 36 + templateIndex * 18) % 360,
      },
    })),
  );

export const EARTH_SATELLITE_BODY = {
  radiusMeters: R_EARTH,
  primaryMassKg: M_EARTH,
};

export const MOON_SATELLITE_BODY = {
  radiusMeters: R_MOON,
  primaryMassKg: M_MOON,
};

function expandEarthOrbit(
  orbit: SatelliteOrbitDefinition,
  index: number,
  templateIndex: number,
): SatelliteOrbitDefinition {
  if (orbit.type === "earth-l2") {
    return {
      ...orbit,
      distanceMeters:
        (orbit.distanceMeters ?? 1_500_000_000) + index * 9_000_000,
    };
  }

  if (orbit.type === "deep-space") {
    return {
      ...orbit,
      distanceMeters:
        (orbit.distanceMeters ?? EARTH_MOON_DISTANCE * 5.75) +
        index * 7_500_000,
      longitudeDeg:
        ((orbit.longitudeDeg ?? 0) + index * 17 + templateIndex * 9) % 360,
      phaseDeg: ((orbit.phaseDeg ?? 0) + index * 18 + templateIndex * 7) % 360,
      inclinationDeg:
        ((orbit.inclinationDeg ?? 0) + ((index % 5) - 2) * 2.5 + 180) % 180,
    };
  }

  if (orbit.type === "geosynchronous") {
    return {
      ...orbit,
      longitudeDeg:
        ((orbit.longitudeDeg ?? 0) + index * 18 + templateIndex * 11) % 360,
    };
  }

  return {
    type: "circular",
    altitudeMeters: sampleClusteredEarthAltitudeMeters(
      orbit,
      index,
      templateIndex,
    ),
    ascendingNodeDeg:
      ((orbit.ascendingNodeDeg ?? 0) + index * 19 + templateIndex * 13) % 360,
    phaseDeg: ((orbit.phaseDeg ?? 0) + index * 18 + templateIndex * 9) % 360,
    inclinationDeg: Math.max(
      0,
      Math.min(179, (orbit.inclinationDeg ?? 0) + ((index % 6) - 3) * 1.4),
    ),
    direction: orbit.direction,
  };
}

function circularBaseAltitudeMeters(
  orbit: SatelliteOrbitDefinition,
  bodyRadiusMeters: number,
  primaryMassKg: number,
  defaultPeriodSeconds: number,
) {
  if (orbit.altitudeMeters != null) {
    return orbit.altitudeMeters;
  }

  if (orbit.distanceMeters != null) {
    return orbit.distanceMeters - bodyRadiusMeters;
  }

  if (orbit.periodSeconds != null) {
    return (
      geosynchronousOrbitRadiusMeters(primaryMassKg, orbit.periodSeconds) -
      bodyRadiusMeters
    );
  }

  return (
    geosynchronousOrbitRadiusMeters(primaryMassKg, defaultPeriodSeconds) -
    bodyRadiusMeters
  );
}

function sampleClusteredEarthAltitudeMeters(
  orbit: SatelliteOrbitDefinition,
  index: number,
  templateIndex: number,
) {
  const seed = templateIndex * 10_000 + index * 97 + 17;
  const bandRoll = pseudoRandom01(seed);
  const offsetRoll = pseudoRandom01(seed + 1);
  const jitterRoll = pseudoRandom01(seed + 2) - 0.5;

  if (bandRoll < 0.86) {
    const altitude =
      LEO_MIN_ALTITUDE_METERS +
      Math.pow(offsetRoll, 2.9) *
        (LEO_CLUSTER_MAX_ALTITUDE_METERS - LEO_MIN_ALTITUDE_METERS);
    return Math.max(LEO_MIN_ALTITUDE_METERS, altitude + jitterRoll * 36_000);
  }

  if (bandRoll < 0.97) {
    const altitude =
      LEO_CLUSTER_MAX_ALTITUDE_METERS +
      Math.pow(offsetRoll, 1.8) *
        (MEO_CLUSTER_MAX_ALTITUDE_METERS - LEO_CLUSTER_MAX_ALTITUDE_METERS);
    return Math.max(LEO_MIN_ALTITUDE_METERS, altitude + jitterRoll * 180_000);
  }

  const baseAltitude = circularBaseAltitudeMeters(
    orbit,
    R_EARTH,
    M_EARTH,
    EARTH_ROTATION_PERIOD,
  );

  return Math.max(
    LEO_MIN_ALTITUDE_METERS,
    baseAltitude * (1 + jitterRoll * 0.08),
  );
}

function pseudoRandom01(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}
