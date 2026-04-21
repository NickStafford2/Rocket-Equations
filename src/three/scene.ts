import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createSceneObjects } from './objects'

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
  scene.background = new THREE.Color(0x040812)
  scene.fog = new THREE.Fog(0x040812, 300, 1800)

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    10000,
  )
  camera.position.set(-42, 56, 122)

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 8
  controls.maxDistance = 1200
  controls.target.set(0, 0, 0)
  controls.update()

  const hemisphereLight = new THREE.HemisphereLight(0xa9d4ff, 0x05070d, 0.75)
  scene.add(hemisphereLight)

  const ambientLight = new THREE.AmbientLight(0x8db7ff, 0.35)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xfff0d6, 1.85)
  directionalLight.position.set(180, 90, 110)
  scene.add(directionalLight)

  const rimLight = new THREE.DirectionalLight(0x4bb8ff, 0.9)
  rimLight.position.set(-120, -20, -160)
  scene.add(rimLight)

  const objects = createSceneObjects(scene)
  scene.add(createStarfield())

  function dispose() {
    controls.dispose()
    scene.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh & {
        geometry?: THREE.BufferGeometry
        material?: THREE.Material | THREE.Material[]
      }
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: THREE.Material) => material.dispose())
      } else {
        mesh.material?.dispose()
      }
    })
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

function createStarfield(): THREE.Points {
  const starCount = 3500
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  const color = new THREE.Color()

  for (let i = 0; i < starCount; i += 1) {
    const radius = THREE.MathUtils.randFloat(520, 1900)
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
    const sinPhi = Math.sin(phi)
    const index = i * 3

    positions[index] = radius * sinPhi * Math.cos(theta)
    positions[index + 1] = radius * Math.cos(phi)
    positions[index + 2] = radius * sinPhi * Math.sin(theta)

    color.setHSL(THREE.MathUtils.randFloat(0.52, 0.62), 0.55, THREE.MathUtils.randFloat(0.72, 0.92))
    colors[index] = color.r
    colors[index + 1] = color.g
    colors[index + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 2.6,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
    depthWrite: false,
  })

  return new THREE.Points(geometry, material)
}
