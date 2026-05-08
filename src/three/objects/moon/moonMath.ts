import * as THREE from "three";

export function latLonToMoonLocalDirection(
  latitudeDegrees: number,
  longitudeDegrees: number,
): THREE.Vector3 {
  const latitudeRadians = THREE.MathUtils.degToRad(latitudeDegrees);
  const longitudeRadians = THREE.MathUtils.degToRad(longitudeDegrees);
  const cosLatitude = Math.cos(latitudeRadians);

  return new THREE.Vector3(
    -cosLatitude * Math.cos(longitudeRadians),
    Math.sin(latitudeRadians),
    cosLatitude * Math.sin(longitudeRadians),
  ).normalize();
}
