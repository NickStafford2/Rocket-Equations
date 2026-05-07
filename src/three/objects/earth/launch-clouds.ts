import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import whitePuffSpriteUrl from "../../../assets/Sprites/whitePuff00.png";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../constants";

const CLOUD_COLOR = 0xe6eaee;
const CLOUD_FADE_START_ALTITUDE_METERS = 12_000;
const CLOUD_FADE_END_ALTITUDE_METERS = 42_000;
const CLOUD_TEXTURE_SIZE = 64;
const CLOUD_POSITION_METERS: [number, number, number] = [0, 2_800, 0];
const CLOUD_SIZE_METERS: [number, number, number] = [16_000, 5_500, 16_000];
const CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER = 6;
const CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER = 14;
const CLOUD_STEPS = 72;
const CLOUD_THRESHOLD = 0.34;
const CLOUD_RANGE = 0.24;
const CLOUD_OPACITY = 0.68;
const CLOUD_WIND_SPEED_X = 0.0016;
const CLOUD_WIND_SPEED_Z = 0.0009;
const SUN_DIRECTION = new THREE.Vector3(0.8, 0.45, 0.25).normalize();

let cachedCloudTexture: THREE.Data3DTexture | null = null;
let cachedCloudSpriteTexture: THREE.Texture | null = null;

type LaunchCloudPuff = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  baseOpacity: number;
  basePosition: THREE.Vector3;
  driftAmplitudeX: number;
  driftAmplitudeZ: number;
  bobAmplitudeY: number;
  phase: number;
};

type CloudDescriptor = {
  positionMeters: [number, number, number];
  scaleMeters: [number, number];
  opacity: number;
  driftAmplitudeMeters: [number, number];
  bobAmplitudeMeters: number;
  phase: number;
};

const CLOUD_PUFFS: CloudDescriptor[] = [
  {
    positionMeters: [0, 2_100, 0],
    scaleMeters: [11_500, 6_400],
    opacity: 0.42,
    driftAmplitudeMeters: [140, 120],
    bobAmplitudeMeters: 85,
    phase: 0.1,
  },
  {
    positionMeters: [1_450, 2_350, -950],
    scaleMeters: [8_800, 5_000],
    opacity: 0.34,
    driftAmplitudeMeters: [120, 95],
    bobAmplitudeMeters: 65,
    phase: 0.45,
  },
  {
    positionMeters: [-1_700, 2_300, 1_100],
    scaleMeters: [8_400, 4_800],
    opacity: 0.34,
    driftAmplitudeMeters: [135, 110],
    bobAmplitudeMeters: 70,
    phase: 0.88,
  },
  {
    positionMeters: [2_600, 2_850, 1_650],
    scaleMeters: [7_200, 4_200],
    opacity: 0.28,
    driftAmplitudeMeters: [110, 90],
    bobAmplitudeMeters: 55,
    phase: 1.3,
  },
  {
    positionMeters: [-2_450, 2_800, -1_900],
    scaleMeters: [7_100, 4_100],
    opacity: 0.28,
    driftAmplitudeMeters: [115, 95],
    bobAmplitudeMeters: 55,
    phase: 1.85,
  },
  {
    positionMeters: [0, 3_150, 2_900],
    scaleMeters: [7_800, 4_500],
    opacity: 0.24,
    driftAmplitudeMeters: [100, 88],
    bobAmplitudeMeters: 50,
    phase: 2.2,
  },
  {
    positionMeters: [0, 3_100, -3_000],
    scaleMeters: [7_800, 4_500],
    opacity: 0.24,
    driftAmplitudeMeters: [100, 88],
    bobAmplitudeMeters: 50,
    phase: 2.6,
  },
];

export type LaunchCloudField = {
  root: THREE.Group;
  volume: THREE.Mesh<THREE.BoxGeometry, THREE.RawShaderMaterial>;
  material: THREE.RawShaderMaterial;
  puffs: LaunchCloudPuff[];
};

export function createLaunchCloudField(): LaunchCloudField {
  const root = new THREE.Group();
  root.name = "launch-cloud-field";

  const volume = createCloudVolumeMesh();
  const puffs = CLOUD_PUFFS.map((descriptor) =>
    createLaunchCloudPuff(root, descriptor),
  );
  root.add(volume);

  return {
    root,
    volume,
    material: volume.material,
    puffs,
  };
}

export function updateLaunchCloudField(
  cloudField: LaunchCloudField,
  {
    cameraPosition,
    elapsedSeconds,
    altitudeMeters,
  }: {
    cameraPosition: THREE.Vector3;
    elapsedSeconds: number;
    altitudeMeters: number;
  },
) {
  const visibility =
    1 -
    THREE.MathUtils.smoothstep(
      altitudeMeters,
      CLOUD_FADE_START_ALTITUDE_METERS,
      CLOUD_FADE_END_ALTITUDE_METERS,
    );

  cloudField.root.visible = visibility > 0.01;
  if (!cloudField.root.visible) {
    return;
  }

  cloudField.material.uniforms.cameraPos.value.copy(cameraPosition);
  cloudField.material.uniforms.visibility.value = visibility;
  cloudField.material.uniforms.time.value = elapsedSeconds;
  cloudField.material.uniforms.frame.value += 1;
  cloudField.material.uniforms.windOffset.value.set(
    elapsedSeconds * CLOUD_WIND_SPEED_X,
    elapsedSeconds * CLOUD_WIND_SPEED_Z,
  );

  for (const puff of cloudField.puffs) {
    puff.sprite.position.set(
      puff.basePosition.x +
        Math.sin(elapsedSeconds * 0.04 + puff.phase) * puff.driftAmplitudeX,
      puff.basePosition.y +
        Math.sin(elapsedSeconds * 0.11 + puff.phase * 1.7) * puff.bobAmplitudeY,
      puff.basePosition.z +
        Math.cos(elapsedSeconds * 0.04 + puff.phase) * puff.driftAmplitudeZ,
    );
    puff.material.opacity =
      puff.baseOpacity *
      visibility *
      (0.92 + 0.08 * Math.sin(elapsedSeconds * 0.07 + puff.phase));
  }
}

function createCloudVolumeMesh(): THREE.Mesh<
  THREE.BoxGeometry,
  THREE.RawShaderMaterial
> {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      base: { value: new THREE.Color(CLOUD_COLOR) },
      map: { value: getCloudTexture() },
      cameraPos: { value: new THREE.Vector3() },
      threshold: { value: CLOUD_THRESHOLD },
      range: { value: CLOUD_RANGE },
      opacity: { value: CLOUD_OPACITY },
      steps: { value: CLOUD_STEPS },
      frame: { value: 0 },
      time: { value: 0 },
      visibility: { value: 1 },
      sunDirection: { value: SUN_DIRECTION.clone() },
      windOffset: { value: new THREE.Vector2() },
    },
    vertexShader: `
      precision highp float;

      in vec3 position;

      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform vec3 cameraPos;

      out vec3 vOrigin;
      out vec3 vDirection;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
        vDirection = position - vOrigin;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      precision highp sampler3D;

      uniform vec3 base;
      uniform sampler3D map;
      uniform float threshold;
      uniform float range;
      uniform float opacity;
      uniform float steps;
      uniform float frame;
      uniform float time;
      uniform float visibility;
      uniform vec3 sunDirection;
      uniform vec2 windOffset;

      in vec3 vOrigin;
      in vec3 vDirection;

      out vec4 color;

      uint wang_hash(uint seed) {
        seed = (seed ^ 61u) ^ (seed >> 16u);
        seed *= 9u;
        seed = seed ^ (seed >> 4u);
        seed *= 0x27d4eb2du;
        seed = seed ^ (seed >> 15u);
        return seed;
      }

      float randomFloat(inout uint seed) {
        return float(wang_hash(seed)) / 4294967296.0;
      }

      vec2 hitBox(vec3 orig, vec3 dir) {
        const vec3 boxMin = vec3(-0.5);
        const vec3 boxMax = vec3(0.5);
        vec3 invDir = 1.0 / dir;
        vec3 tminTmp = (boxMin - orig) * invDir;
        vec3 tmaxTmp = (boxMax - orig) * invDir;
        vec3 tmin = min(tminTmp, tmaxTmp);
        vec3 tmax = max(tminTmp, tmaxTmp);
        float t0 = max(tmin.x, max(tmin.y, tmin.z));
        float t1 = min(tmax.x, min(tmax.y, tmax.z));
        return vec2(t0, t1);
      }

      float sampleDensity(vec3 p) {
        vec3 samplePoint = p + 0.5;
        samplePoint.xz = fract(samplePoint.xz + windOffset);
        samplePoint.y = clamp(samplePoint.y, 0.0, 1.0);
        return texture(map, samplePoint).r;
      }

      float sampleLighting(vec3 p) {
        float offset = 0.03;
        float towardSun = sampleDensity(p + sunDirection * offset);
        float awayFromSun = sampleDensity(p - sunDirection * offset);
        return clamp((towardSun - awayFromSun) * 2.2 + 0.55, 0.0, 1.0);
      }

      vec4 linearToSRGB(vec4 value) {
        return vec4(
          mix(
            pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055),
            value.rgb * 12.92,
            vec3(lessThanEqual(value.rgb, vec3(0.0031308)))
          ),
          value.a
        );
      }

      void main() {
        vec3 rayDir = normalize(vDirection);
        vec2 bounds = hitBox(vOrigin, rayDir);

        if (bounds.x > bounds.y) {
          discard;
        }

        bounds.x = max(bounds.x, 0.0);
        float stepSize = (bounds.y - bounds.x) / steps;

        uint seed = uint(gl_FragCoord.x) * 1973u +
          uint(gl_FragCoord.y) * 9277u +
          uint(frame) * 26699u;

        float jitter = randomFloat(seed) * 2.0 - 1.0;
        vec3 p = vOrigin + bounds.x * rayDir + rayDir * jitter * stepSize;
        vec4 accumulated = vec4(0.0);

        for (float i = 0.0; i < 160.0; i += 1.0) {
          if (i >= steps) {
            break;
          }

          float density = sampleDensity(p);
          density = smoothstep(threshold - range, threshold + range, density);
          density *= opacity * visibility;

          if (density > 0.001) {
            float light = sampleLighting(p);
            float heightTint = clamp((p.y + 0.5) * 0.9 + 0.1, 0.0, 1.0);
            vec3 shadedColor = mix(base * 0.9, base * 1.7, light);
            shadedColor *= mix(0.95, 1.15, heightTint);

            accumulated.rgb += (1.0 - accumulated.a) * density * shadedColor;
            accumulated.a += (1.0 - accumulated.a) * density;
          }

          if (accumulated.a >= 0.97) {
            break;
          }

          p += rayDir * stepSize;
        }

        color = linearToSRGB(accumulated);

        if (color.a <= 0.01) {
          discard;
        }
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  material.toneMapped = false;

  const volume = new THREE.Mesh(geometry, material);
  volume.position.copy(
    toSceneVector(CLOUD_POSITION_METERS, CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER),
  );
  volume.scale.copy(
    toSceneVector(CLOUD_SIZE_METERS, CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER),
  );
  volume.renderOrder = 8;
  volume.frustumCulled = false;

  return volume;
}

function createLaunchCloudPuff(
  root: THREE.Group,
  descriptor: CloudDescriptor,
): LaunchCloudPuff {
  const material = new THREE.SpriteMaterial({
    color: CLOUD_COLOR,
    map: getCloudSpriteTexture(),
    transparent: true,
    opacity: descriptor.opacity,
    depthWrite: false,
  });
  material.toneMapped = false;

  const sprite = new THREE.Sprite(material);
  sprite.position.copy(
    toSceneVector(
      descriptor.positionMeters,
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
  );
  const [widthMeters, heightMeters] = descriptor.scaleMeters;
  const scale = toSceneScale(
    widthMeters,
    heightMeters,
    CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
  );
  sprite.scale.set(scale.x, scale.y, 1);
  sprite.renderOrder = 9;
  sprite.frustumCulled = false;
  root.add(sprite);

  return {
    sprite,
    material,
    baseOpacity: descriptor.opacity,
    basePosition: sprite.position.clone(),
    driftAmplitudeX: toSceneUnits(
      descriptor.driftAmplitudeMeters[0],
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    driftAmplitudeZ: toSceneUnits(
      descriptor.driftAmplitudeMeters[1],
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    bobAmplitudeY: toSceneUnits(
      descriptor.bobAmplitudeMeters,
      CLOUD_PUFF_VISUAL_SCALE_MULTIPLIER,
    ),
    phase: descriptor.phase,
  };
}

function getCloudTexture(): THREE.Data3DTexture {
  if (cachedCloudTexture) {
    return cachedCloudTexture;
  }

  const size = CLOUD_TEXTURE_SIZE;
  const data = new Uint8Array(size * size * size);
  const perlin = new ImprovedNoise();

  let index = 0;
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = x / (size - 1);
        const v = y / (size - 1);
        const w = z / (size - 1);
        const nx = u - 0.5;
        const nz = w - 0.5;

        const radialDistance = Math.sqrt(nx * nx + nz * nz);
        const horizontalMask =
          1 - THREE.MathUtils.smoothstep(0.3, 0.72, radialDistance);
        const lowerFalloff = THREE.MathUtils.smoothstep(0.08, 0.28, v);
        const upperFalloff = 1 - THREE.MathUtils.smoothstep(0.55, 0.95, v);
        const verticalMask = lowerFalloff * upperFalloff;
        const edgeMask =
          THREE.MathUtils.smoothstep(0.03, 0.16, u) *
          THREE.MathUtils.smoothstep(0.03, 0.16, 1 - u) *
          THREE.MathUtils.smoothstep(0.03, 0.16, w) *
          THREE.MathUtils.smoothstep(0.03, 0.16, 1 - w);

        const weather = 0.5 + 0.5 * perlin.noise(x * 0.028, 11.7, z * 0.028);
        const billow = 0.5 + 0.5 * perlin.noise(x * 0.05, y * 0.09, z * 0.05);
        const detail =
          0.5 + 0.5 * perlin.noise(x * 0.11 + 19.0, y * 0.2, z * 0.11 + 7.0);
        const wisps =
          0.5 + 0.5 * perlin.noise(x * 0.18 + 41.0, y * 0.31, z * 0.18 + 13.0);

        let density =
          horizontalMask *
          verticalMask *
          edgeMask *
          Math.max(weather - radialDistance * 0.55, 0) *
          (billow * 0.65 + detail * 0.25 + wisps * 0.1);

        density = Math.pow(THREE.MathUtils.clamp(density, 0, 1), 1.35);
        data[index] = Math.floor(density * 255);
        index += 1;
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  cachedCloudTexture = texture;
  return texture;
}

function getCloudSpriteTexture(): THREE.Texture {
  if (cachedCloudSpriteTexture) {
    return cachedCloudSpriteTexture;
  }

  const texture = new THREE.TextureLoader().load(whitePuffSpriteUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedCloudSpriteTexture = texture;
  return texture;
}

function toSceneVector(
  [xMeters, yMeters, zMeters]: [number, number, number],
  visualScaleMultiplier: number,
): THREE.Vector3 {
  const scale = ORBIT_METERS_TO_SCENE_UNITS * visualScaleMultiplier;
  return new THREE.Vector3(xMeters * scale, yMeters * scale, zMeters * scale);
}

function toSceneScale(
  widthMeters: number,
  heightMeters: number,
  visualScaleMultiplier: number,
): THREE.Vector2 {
  return new THREE.Vector2(
    toSceneUnits(widthMeters, visualScaleMultiplier),
    toSceneUnits(heightMeters, visualScaleMultiplier),
  );
}

function toSceneUnits(meters: number, visualScaleMultiplier: number): number {
  return meters * ORBIT_METERS_TO_SCENE_UNITS * visualScaleMultiplier;
}
