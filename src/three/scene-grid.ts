import * as THREE from "three";

const GRID_SIZE = 520 * 9;
const GRID_MINOR_SPACING = 6;
const GRID_MAJOR_SPACING = GRID_MINOR_SPACING * 4;

export function createOrbitalGrid(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 1, 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uMinorColor: { value: new THREE.Color(0x28455d) },
      uMajorColor: { value: new THREE.Color(0x4dd0ff) },
      uMinorSpacing: { value: GRID_MINOR_SPACING },
      uMajorSpacing: { value: GRID_MAJOR_SPACING },
      uMinorOpacity: { value: 0.3 },
      uMajorOpacity: { value: 0.05 },
      uFadeNear: { value: GRID_SIZE * 0.08 },
      uFadeFar: { value: GRID_SIZE * 0.29 },
      uGridHalfSize: { value: GRID_SIZE / 2 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uMinorColor;
      uniform vec3 uMajorColor;
      uniform float uMinorSpacing;
      uniform float uMajorSpacing;
      uniform float uMinorOpacity;
      uniform float uMajorOpacity;
      uniform float uFadeNear;
      uniform float uFadeFar;
      uniform float uGridHalfSize;

      varying vec3 vWorldPosition;

      float gridLineFactor(vec2 coord, float spacing) {
        vec2 grid = abs(fract(coord / spacing - 0.5) - 0.5) / fwidth(coord / spacing);
        return 1.0 - min(min(grid.x, grid.y), 1.0);
      }

      void main() {
        vec2 coord = vWorldPosition.xz;
        float radialDistance = distance(cameraPosition.xz, coord);
        float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, radialDistance);

        float edgeFade = 1.0 - smoothstep(
          uGridHalfSize * 0.82,
          uGridHalfSize,
          max(abs(coord.x), abs(coord.y))
        );

        float visibility = fade * edgeFade;

        float minorLine = gridLineFactor(coord, uMinorSpacing);
        float majorLine = gridLineFactor(coord, uMajorSpacing);

        vec3 color = mix(uMinorColor, uMajorColor, majorLine);
        float alpha = max(
          minorLine * uMinorOpacity * (1.0 - majorLine),
          majorLine * uMajorOpacity
        ) * visibility;

        if (alpha <= 0.001) {
          discard;
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const grid = new THREE.Mesh(geometry, material);
  grid.renderOrder = -1;

  return grid;
}

export function createAxisHelper(): THREE.AxesHelper {
  const axes = new THREE.AxesHelper(48);
  const material = axes.material as THREE.Material | THREE.Material[];

  const applyMaterialSettings = (entry: THREE.Material) => {
    entry.transparent = true;
    entry.opacity = 0.9;
    entry.depthWrite = false;
  };

  if (Array.isArray(material)) {
    material.forEach(applyMaterialSettings);
  } else {
    applyMaterialSettings(material);
  }

  return axes;
}
