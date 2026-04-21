import * as THREE from 'three'
import starTextureUrl from '../assets/textures/8k_stars.jpg'
import skyTextureUrl from '../assets/textures/stars.jpg'

export function createReferenceSkybox(): THREE.Group {
  const loader = new THREE.TextureLoader()
  const starTexture = loader.load(starTextureUrl)
  const skyTexture = loader.load(skyTextureUrl)

  const starfield = new THREE.Mesh(
    new THREE.SphereGeometry(3200, 64, 64),
    new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide,
      toneMapped: false,
      fog: false,
      color: new THREE.Color(1.2, 1.2, 1.2),
    }),
  )

  const skyfield = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 64, 64),
    new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      toneMapped: false,
      fog: false,
      transparent: true,
      opacity: 0.3,
      color: new THREE.Color(0.8, 0.9, 1.0),
    }),
  )

  const skybox = new THREE.Group()
  skybox.add(starfield)
  skybox.add(skyfield)
  return skybox
}
