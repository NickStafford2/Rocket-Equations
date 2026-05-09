const position = new Vector3(/* ECEF coordinate in meters */)

// SkyMaterial disables projection. Provide a plane that covers clip space.
const skyMaterial = new SkyMaterial()
const sky = new Mesh(new PlaneGeometry(2, 2), skyMaterial)
sky.frustumCulled = false
sky.position.copy(position)
scene.add(sky)

// SkyLightProbe computes sky irradiance of its position.
const skyLight = new SkyLightProbe()
skyLight.position.copy(position)
scene.add(skyLight)

// SunDirectionalLight computes sunlight transmittance to its target position.
const sunLight = new SunDirectionalLight()
sunLight.target.position.copy(position)
scene.add(sunLight)
scene.add(sunLight.target)

// Demonstrates light-source lighting here. For post-process lighting, set
// sunLight and skyLight to true, remove SkyLightProbe and
// SunDirectionalLight, and provide a normal buffer to AerialPerspectiveEffect.
const aerialPerspective = new AerialPerspectiveEffect(camera)

// Use floating-point render buffer, as radiance/luminance is stored here.
const composer = new EffectComposer(renderer, {
  frameBufferType: HalfFloatType
})
composer.addPass(new RenderPass(scene, camera))
composer.addPass(
  new EffectPass(
    camera,
    aerialPerspective,
    new ToneMappingEffect({ mode: ToneMappingMode.AGX })
  )
)

const generator = new PrecomputedTexturesGenerator(renderer)
generator.update().catch((error: unknown) => {
  console.error(error)
})

const { textures } = generator
Object.assign(skyMaterial, textures)
sunLight.transmittanceTexture = textures.transmittanceTexture
skyLight.irradianceTexture = textures.irradianceTexture
Object.assign(aerialPerspective, textures)

const sunDirection = new Vector3()
const moonDirection = new Vector3()

function render(): void {
  // Suppose `date` is updated elsewhere.
  getSunDirectionECEF(date, sunDirection)
  getMoonDirectionECEF(date, moonDirection)

  skyMaterial.sunDirection.copy(sunDirection)
  skyMaterial.moonDirection.copy(moonDirection)
  sunLight.sunDirection.copy(sunDirection)
  skyLight.sunDirection.copy(sunDirection)
  aerialPerspective.sunDirection.copy(sunDirection)

  sunLight.update()
  skyLight.update()
  composer.render()
}
