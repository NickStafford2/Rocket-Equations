uniform sampler2D uCloudTexture;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  vec3 cloudSample = texture2D(uCloudTexture, vUv).rgb;
  float cloudMask = dot(cloudSample, vec3(0.2126, 0.7152, 0.0722));
  float alpha = cloudMask * uOpacity;
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
