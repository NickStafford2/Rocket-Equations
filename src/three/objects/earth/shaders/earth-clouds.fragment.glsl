uniform sampler2D uCloudTexture;
uniform vec3 uSunPosition;
uniform float uOpacity;
uniform float uDayBrightness;
uniform float uNightBrightness;
uniform vec3 uTwilightColor;
uniform float uTwilightStrength;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 cloudSample = texture2D(uCloudTexture, vUv).rgb;
  float cloudMask = dot(cloudSample, vec3(0.2126, 0.7152, 0.0722));
  float alpha = cloudMask * uOpacity;

  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
  float lightAmount = dot(normalize(vWorldNormal), sunDirection);
  float dayMask = smoothstep(-0.18, 0.18, lightAmount);
  float brightness = mix(uNightBrightness, uDayBrightness, dayMask);
  float twilight = 1.0 - smoothstep(0.0, 0.42, abs(lightAmount));
  vec3 twilightTint = uTwilightColor * twilight * uTwilightStrength;

  gl_FragColor = vec4(vec3(brightness) + twilightTint, alpha);
}
