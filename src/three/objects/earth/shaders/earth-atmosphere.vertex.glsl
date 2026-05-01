varying vec3 vNormal;
varying vec3 vNormalView;
varying vec3 vPosition;

void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vNormalView = normalize(normalMatrix * normal);
  vPosition = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
