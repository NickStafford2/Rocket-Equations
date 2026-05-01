uniform vec3 uSunPosition;
uniform vec3 uAtmosphereColor;
uniform vec3 uNightAtmosphereColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);

  // Strong first-pass rim so the shell is obvious before we tune it down.
  float rim = pow(1.0 - saturate(dot(viewDirection, normalize(vWorldNormal))), 3.0);
  float dayMask = smoothstep(-0.12, 0.3, dot(normalize(vWorldNormal), sunDirection));

  vec3 color = mix(uNightAtmosphereColor, uAtmosphereColor, dayMask);
  float alpha = rim * mix(0.18, 0.55, dayMask);

  gl_FragColor = vec4(color, alpha);
}
