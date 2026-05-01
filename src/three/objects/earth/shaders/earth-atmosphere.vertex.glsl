varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewNormal = normalize(normalMatrix * normal);
  vViewPosition = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
