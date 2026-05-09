import * as THREE from "three";
import {
  CLOUD_COLOR,
  CLOUD_OPACITY,
  CLOUD_POSITION_METERS,
  CLOUD_RANGE,
  CLOUD_SIZE_METERS,
  CLOUD_STEPS,
  CLOUD_THRESHOLD,
  CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER,
  SUN_DIRECTION,
} from "./constants";
import { getCloudTexture } from "./cloud-texture";
import { offsetCloudHeight, toSceneVector } from "./units";

export function createCloudVolumeMesh(): THREE.Mesh<
  THREE.BoxGeometry,
  THREE.RawShaderMaterial
> {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = createCloudVolumeMaterial();

  const volume = new THREE.Mesh(geometry, material);

  volume.position.copy(
    toSceneVector(
      offsetCloudHeight(CLOUD_POSITION_METERS),
      CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER,
    ),
  );

  volume.scale.copy(
    toSceneVector(CLOUD_SIZE_METERS, CLOUD_VOLUME_VISUAL_SCALE_MULTIPLIER),
  );

  volume.renderOrder = 8;
  volume.frustumCulled = false;

  return volume;
}

function createCloudVolumeMaterial(): THREE.RawShaderMaterial {
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

  return material;
}
