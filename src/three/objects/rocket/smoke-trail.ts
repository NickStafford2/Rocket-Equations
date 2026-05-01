import * as THREE from "three";

// Adjust for your scene settings (feel free to tweak these values)
const SMOKE_LIFETIME = 5; // seconds before particle resets
const SMOKE_FADE_SPEED = 0.05; // how quickly particles fade out
const SMOKE_PARTICLE_SIZE = 1.5; // Size of each particle
const SMOKE_SPEED = 0.3; // Speed of the particles moving in the trail
const GRAVITY = -0.02; // Gravity effect on the smoke particles (optional)

interface SmokeParticle {
  lifetime: number; // Lifetime of the particle in seconds
  position: THREE.Vector3;
  velocity: THREE.Vector3; // Speed and direction of the particle
  opacity: number; // Opacity of the particle to simulate fading
}

// Constants for smoke particles
const SMOKE_PARTICLE_COUNT = 1000; // Number of particles in the trail
const SMOKE_COLOR = new THREE.Color(0x808080); // Smoke color

export function createSmokeTrail(): THREE.Points {
  console.log("createSmokeTrail");
  // Create a geometry for the particles (we will use a BufferGeometry for better performance)
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(SMOKE_PARTICLE_COUNT * 3); // x, y, z for each particle
  const colors = new Float32Array(SMOKE_PARTICLE_COUNT * 3); // RGB color values for each particle

  // Initialize particles
  for (let i = 0; i < SMOKE_PARTICLE_COUNT; i++) {
    // Randomly place particles around the rocket's starting position
    positions[i * 3] = Math.random() * 0.5 - 0.25; // Random X offset
    positions[i * 3 + 1] = Math.random() * 0.5; // Random Y offset (height above the rocket)
    positions[i * 3 + 2] = Math.random() * 0.5 - 0.25; // Random Z offset

    // Set color (initially gray for smoke)
    colors[i * 3] = SMOKE_COLOR.r; // Red channel
    colors[i * 3 + 1] = SMOKE_COLOR.g; // Green channel
    colors[i * 3 + 2] = SMOKE_COLOR.b; // Blue channel
  }

  // Add the position and color attributes to the geometry
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Create a material for the smoke particles
  const material = new THREE.PointsMaterial({
    size: SMOKE_PARTICLE_SIZE,
    vertexColors: true, // Use vertex colors (for opacity fading)
    transparent: true,
    opacity: 0.6, // Initial opacity of smoke
  });

  // Create the points (particle system)
  const smokeTrail = new THREE.Points(geometry, material);
  smokeTrail.name = "smokeTrail";

  return smokeTrail;
}

export function updateSmokeTrail(
  smoke: THREE.Points,
  rocketPosition: THREE.Vector3,
): void {
  console.log("updateSmokeTrail");
  const positions = smoke.geometry.attributes.position.array as Float32Array;
  const colors = smoke.geometry.attributes.color.array as Float32Array; // For fading effects
  const particleCount = positions.length / 3;

  for (let i = 0; i < particleCount; i++) {
    const offset = i * 3;

    // Store each particle’s current position
    const x = positions[offset];
    const y = positions[offset + 1];
    const z = positions[offset + 2];

    // Calculate the direction to move each particle
    const direction = new THREE.Vector3(
      Math.random() * 0.2 - 0.1, // Random X direction
      Math.random() * 0.2 + 0.1, // Upward Y direction
      Math.random() * 0.2 - 0.1, // Random Z direction
    );

    // Move particles over time based on velocity
    positions[offset] += direction.x * SMOKE_SPEED;
    positions[offset + 1] += direction.y * SMOKE_SPEED + GRAVITY; // Apply gravity
    positions[offset + 2] += direction.z * SMOKE_SPEED;

    // Simulate fading by reducing opacity over time
    const age = rocketPosition.y - y; // Calculate particle's age based on its distance from the rocket
    const opacity = Math.max(0, 1 - age / SMOKE_LIFETIME);
    colors[offset + 0] = opacity; // Red channel for opacity
    colors[offset + 1] = opacity * 0.5; // Green channel (dimmed opacity)
    colors[offset + 2] = opacity * 0.25; // Blue channel (dimmed opacity)

    // Reset the particle when it moves too far away or has faded out
    if (y < rocketPosition.y - SMOKE_LIFETIME) {
      positions[offset + 1] = rocketPosition.y; // Reset to the rocket's position
      positions[offset] = Math.random() * 0.5 - 0.25; // Random X
      positions[offset + 2] = Math.random() * 0.5 - 0.25; // Random Z

      // Randomize the initial direction slightly
      direction.set(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 + 0.1,
        Math.random() * 0.2 - 0.1,
      );
    }
  }

  smoke.geometry.attributes.position.needsUpdate = true;
  smoke.geometry.attributes.color.needsUpdate = true; // Ensure color updates are applied
}
