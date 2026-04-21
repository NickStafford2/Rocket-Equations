import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EARTH_MOON_DISTANCE } from '../physics/bodies'
import { DISTANCE_SCALE, createSceneObjects } from './objects'

export type ThreeSceneBundle = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  objects: ReturnType<typeof createSceneObjects>
  dispose: () => void
}

export function createThreeScene(container: HTMLDivElement): ThreeSceneBundle {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x08101b)

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    10000,
  )
  camera.position.set(0, 120, 260)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(EARTH_MOON_DISTANCE * DISTANCE_SCALE * 0.35, 0, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3)
  directionalLight.position.set(120, 80, 120)
  scene.add(directionalLight)

  const objects = createSceneObjects(scene)

  function dispose() {
    controls.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    objects,
    dispose,
  }
}
