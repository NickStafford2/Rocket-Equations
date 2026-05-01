import * as THREE from "three";

// Constants for smoke particles
const SMOKE_LIFETIME = 5; // Lifetime of each particle (seconds before it resets)
const SMOKE_SPEED = 0.3; // Speed of the particles (used now)
const GRAVITY = -0.02; // Gravity effect on particles (optional)

const SMOKE_PARTICLE_COUNT = 500; // Number of particles
const CUBE_SIZE = 1; // Size of each smoke cube
const SMOKE_COLOR = new THREE.Color(0x808080); // Smoke color (gray)

// Function to create smoke trail
export function createSmokeTrail(): THREE.Group {
  console.log("createSmokeTrail");

  // Create a group to hold all the smoke cubes
  const smokeGroup = new THREE.Group();

  // Initialize particles with cubes
  for (let i = 0; i < SMOKE_PARTICLE_COUNT; i++) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE), // Cube geometry for the particle
      new THREE.MeshBasicMaterial({
        color: SMOKE_COLOR,
        transparent: true,
        opacity: 0.8,
      }),
    );

    // Randomize the initial position of the cubes
    cube.position.set(
      Math.random() * 0.5 - 0.25, // X offset
      Math.random() * 0.5, // Y offset
      Math.random() * 0.5 - 0.25, // Z offset
    );

    // Randomize the velocity of the cubes
    cube.userData = {
      velocity: new THREE.Vector3(
        Math.random() * 0.2 - 0.1, // Random X velocity
        Math.random() * 0.2 + 0.1, // Random Y velocity (upward)
        Math.random() * 0.2 - 0.1, // Random Z velocity
      ),
      lifetime: 0, // Track lifetime of the particle
    };

    smokeGroup.add(cube); // Add the cube to the smoke group
  }

  return smokeGroup;
}

export function updateSmokeTrail(
  smoke: THREE.Group,
  rocketPosition: THREE.Vector3,
): void {
  console.log("updateSmokeTrail");

  // Loop through the children (the cubes)
  smoke.children.forEach((cube) => {
    // Move the cube based on its velocity
    cube.position.add(
      cube.userData.velocity.clone().multiplyScalar(SMOKE_SPEED),
    );

    // Apply gravity on Y-axis
    cube.position.y += GRAVITY;

    // Log the position to see if it's moving
    console.log(cube.position);

    // Add AxesHelper to each cube to see their movement visually
    if (!cube.userData.hasAxesHelper) {
      const axes = new THREE.AxesHelper(0.5); // Add axes helper to the cube
      cube.add(axes);
      cube.userData.hasAxesHelper = true; // Prevent adding multiple helpers to the same cube
    }
  });

  // Update all cubes to move with the rocket by adjusting the smoke group's position
  smoke.position.copy(rocketPosition);
}
