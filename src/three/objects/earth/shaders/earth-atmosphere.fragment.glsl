uniform vec3 u_sunRelPosition;
uniform vec3 u_color; // the color of atmosphere

varying vec3 vNormal;
varying vec3 vNormalView;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main( void ) {
    vec3 sunDir = normalize(u_sunRelPosition);
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

    // Keep the glow pinned to the limb so the planet does not turn into
    // a bright orb when the camera pulls back.
    float horizon = 1.0 - abs(dot(worldNormal, viewDirection));
    float horizonGlow = pow(clamp(horizon, 0.0, 1.0), 3.5);

    // Only light the atmosphere where the sun reaches it, with a soft
    // transition across the terminator for a subtle blue fringe.
    float daySide = smoothstep(-0.2, 0.35, dot(worldNormal, sunDir));

    float alpha = horizonGlow * daySide * 0.18;
    vec3 color = u_color * mix(0.55, 1.0, daySide);

    gl_FragColor = vec4(color, alpha);
}
