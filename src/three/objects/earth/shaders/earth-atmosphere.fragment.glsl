uniform vec3 uSunPosition;
uniform vec3 uDayColor;
uniform vec3 uTwilightColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

  float sunAmount = saturate(dot(vWorldNormal, sunDirection));
  float fresnel = pow(1.0 - saturate(dot(viewDirection, vWorldNormal)), 3.0);
  float twilight = pow(1.0 - abs(dot(vWorldNormal, sunDirection)), 2.8);

  vec3 color = mix(uTwilightColor, uDayColor, pow(sunAmount, 0.55));
  float alpha = fresnel * (0.18 + twilight * 0.75 + sunAmount * 0.22);

  gl_FragColor = vec4(color, alpha * 0.55);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
