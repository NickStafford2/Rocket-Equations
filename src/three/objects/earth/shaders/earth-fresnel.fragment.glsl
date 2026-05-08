uniform vec3 u_sunRelPosition;
uniform vec3 u_color;

varying vec3 vNormal;
varying vec3 vNormalView;
varying vec3 vPosition;

void main() {
    vec3 sunDir = u_sunRelPosition;
    vec3 sunDirUnit = normalize(sunDir);

    // Day and night texture with eclipse
    float cosAngleSunToNormal = dot(vNormal, sunDirUnit); // Compute cosine sun to normal
    float mixAmount = 1. / (1. + exp(-7. * (cosAngleSunToNormal + 0.1))); // Sharpen the edge beween the transition
    vec3 viewDir = normalize(-vPosition);
    float fresnelTerm = 1.0 - clamp(dot(normalize(vNormalView), viewDir), 0.0, 1.0);
    fresnelTerm = pow(fresnelTerm, 3.0);

    gl_FragColor = vec4(u_color, fresnelTerm * mixAmount);
}
