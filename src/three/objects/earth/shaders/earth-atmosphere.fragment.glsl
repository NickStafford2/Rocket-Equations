uniform vec3 u_sunRelPosition;
uniform vec3 u_color; // the color of atmosphere

varying vec3 vNormal;
varying vec3 vNormalView;
varying vec3 vPosition;

void main( void ) {
    vec3 sunDir = u_sunRelPosition;
    vec3 sunDirUnit = normalize(sunDir);
    // Day and night texture
    float cosAngleSunToNormal = dot(vNormal, sunDirUnit); // Compute cosine sun to normal
    float mixAmount = 1. / (1. + exp(-7. * (cosAngleSunToNormal + 0.1))); // Sharpen the edge beween the transition

    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - clamp(abs(dot(normalize(vNormalView), viewDir)), 0.0, 1.0);
    float intensity = pow(rim, 2.6);

    gl_FragColor = vec4(u_color, intensity) * mixAmount;
}
