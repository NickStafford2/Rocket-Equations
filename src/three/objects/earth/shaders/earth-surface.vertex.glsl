varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying mat3 vTbn;

attribute vec4 tangent;

void main() {
  vUv = uv;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vec3 worldTangent = normalize(mat3(modelMatrix) * tangent.xyz);
  vec3 worldBitangent = normalize(cross(worldNormal, worldTangent) * tangent.w);

  vWorldPosition = worldPosition.xyz;
  vWorldNormal = worldNormal;
  vTbn = mat3(worldTangent, worldBitangent, worldNormal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
