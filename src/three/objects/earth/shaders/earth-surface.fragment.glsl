uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uCloudTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uSpecularTexture;
uniform vec3 uSunPosition;
uniform float uNormalScale;
uniform float uCloudOpacity;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying mat3 vTbn;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

  vec3 tangentNormal = texture2D(uNormalTexture, vUv).xyz * 2.0 - 1.0;
  tangentNormal.xy *= uNormalScale;
  vec3 surfaceNormal = normalize(vTbn * tangentNormal);

  float lightAmount = dot(surfaceNormal, sunDirection);
  float hemisphereLight = smoothstep(-0.12, 0.45, dot(vWorldNormal, sunDirection));
  float dayMask = smoothstep(-0.18, 0.16, lightAmount);

  vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
  vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
  vec3 surfaceColor = mix(nightColor * 1.25, dayColor, dayMask);

  vec3 cloudSample = texture2D(uCloudTexture, vUv).rgb;
  float cloudMask = smoothstep(0.38, 0.7, luminance(cloudSample));
  float cloudShadow = cloudMask * smoothstep(0.1, 0.65, hemisphereLight) * 0.18;
  surfaceColor *= 1.0 - cloudShadow;

  vec3 cloudColor = mix(cloudSample * 0.9, vec3(1.0), 0.55);
  cloudColor *= mix(0.24, 1.0, hemisphereLight);
  surfaceColor = mix(surfaceColor, cloudColor, cloudMask * uCloudOpacity);

  vec3 halfVector = normalize(sunDirection + viewDirection);
  float specularMask = texture2D(uSpecularTexture, vUv).r;
  float specular = pow(saturate(dot(surfaceNormal, halfVector)), 64.0);

  float rim = pow(1.0 - saturate(dot(viewDirection, vWorldNormal)), 3.5);
  float twilight = pow(1.0 - abs(dot(vWorldNormal, sunDirection)), 4.0);

  surfaceColor += vec3(0.06, 0.11, 0.22) * twilight * 0.35;
  surfaceColor += vec3(0.05, 0.18, 0.38) * rim * smoothstep(-0.2, 0.3, lightAmount);
  surfaceColor += vec3(1.0) * specular * specularMask * dayMask * 0.55;

  gl_FragColor = vec4(surfaceColor, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
