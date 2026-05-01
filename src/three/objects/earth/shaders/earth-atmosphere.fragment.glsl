uniform vec3 uSunPosition;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vNormalView;
varying vec3 vPosition;

void main() {
  vec3 sunDir = uSunPosition;
  vec3 sunDirUnit = normalize(sunDir);

  // Keep the article's day/night mask, but tighten the visible atmosphere
  // toward the limb so it does not read like a full glowing disk at distance.
  float cosAngleSunToNormal = dot(vNormal, sunDirUnit);
  float mixAmount = 1. / (1. + exp(-7. * (cosAngleSunToNormal + 0.1)));

  float rimBase = max(dot(vPosition, vNormalView), 0.);
  float intensity = pow(rimBase, 6.0) * 1.35;

  gl_FragColor = vec4(uColor, intensity) * mixAmount;
}
