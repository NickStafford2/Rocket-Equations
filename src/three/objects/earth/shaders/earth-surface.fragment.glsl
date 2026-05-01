uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform vec3 uSunPosition;
uniform float uNightStrength;
uniform float uTerminatorSoftness;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
  float lightAmount = dot(normalize(vWorldNormal), sunDirection);
  float dayMask = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, lightAmount);

  vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
  vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
  vec3 surfaceColor = mix(nightColor * uNightStrength, dayColor, dayMask);

  float twilight = 1.0 - abs(lightAmount);
  surfaceColor += vec3(0.06, 0.11, 0.22) * pow(saturate(twilight), 5.0) * 0.35;

  gl_FragColor = vec4(surfaceColor, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
