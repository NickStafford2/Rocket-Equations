uniform sampler2D uCloudTexture;
uniform vec3 uSunPosition;
uniform float uDayOpacity;
uniform float uNightOpacity;
uniform float uCloudBrightness;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 cloudSample = texture2D(uCloudTexture, vUv).rgb;
  float cloudMask = dot(cloudSample, vec3(0.2126, 0.7152, 0.0722));

  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
  float lightAmount = dot(normalize(vWorldNormal), sunDirection);
  float hemisphereLight = smoothstep(-0.18, 0.18, lightAmount);

  // Match the reference approach: blue falls off fastest at the terminator,
  // green next, and red slowest. That yields a subtle warm edge without
  // painting an explicit orange band onto the clouds.
  vec3 color = vec3(
    clamp(hemisphereLight, 0.2, 1.0),
    clamp(pow(hemisphereLight, 1.5), 0.2, 1.0),
    clamp(pow(hemisphereLight, 2.0), 0.2, 1.0)
  ) * uCloudBrightness;

  // Keep some cloud presence on the dark side, but let opacity rise toward
  // the lit hemisphere so the night side does not stay as visually heavy.
  float opacity = mix(uNightOpacity, uDayOpacity, hemisphereLight);
  float alpha = cloudMask * opacity * clamp(hemisphereLight, 0.1, 1.0);

  gl_FragColor = vec4(color, alpha);
}
