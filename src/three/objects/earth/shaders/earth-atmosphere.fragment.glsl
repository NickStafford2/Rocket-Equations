uniform vec3 uSunPosition;
uniform vec3 uColor;

varying vec3 vWorldNormal;
varying vec3 vViewNormal;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 sunDirection = normalize(uSunPosition);
  float sunAmount = saturate(dot(normalize(vWorldNormal), sunDirection));

  // Match the reference shell behavior: strongest at the limb, weaker toward
  // the center, and biased toward the lit hemisphere.
  float rim = pow(1.0 - saturate(abs(vViewNormal.z)), 2.6);
  float alpha = rim * mix(0.08, 0.42, pow(sunAmount, 0.65));

  gl_FragColor = vec4(uColor, alpha);
}
