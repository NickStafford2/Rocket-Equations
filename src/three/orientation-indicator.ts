import * as THREE from "three";
import {
  createRocketVisual,
  getRocketTargetScaleRatio,
  type RocketModelVariant,
} from "./objects/rocket";

const INDICATOR_ROCKET_HEIGHT = 1.7 / 4;
const VECTOR_ARROW_LENGTH = 1.45;
const VECTOR_VALUE_LABEL_POSITION = new THREE.Vector3(0, -1.28, 0);

type IndicatorSceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: THREE.Group;
};

export type OrientationIndicatorBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: THREE.Group;
  rocket: THREE.Group;
  setRocketModelVariant: (variant: RocketModelVariant) => void;
  sizePx: number;
};

export type VectorIndicatorBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: THREE.Group;
  arrow: THREE.ArrowHelper;
  arrowLength: number;
  setValueLabel: (text: string) => void;
  sizePx: number;
};

export function createOrientationIndicator(): OrientationIndicatorBundle {
  const { scene, camera, frame } = createIndicatorScene();

  const rocket = new THREE.Group();
  const rocketScaleRoot = new THREE.Group();
  const rocketVisual = createRocketVisual(INDICATOR_ROCKET_HEIGHT, {
    useConfiguredTargetSize: false,
    onScaled: ({ center }) => {
      rocketVisual.root.position.copy(center).multiplyScalar(-1);
    },
  });
  rocketScaleRoot.add(rocketVisual.root);
  rocket.add(rocketScaleRoot);
  frame.add(rocket);

  function setRocketModelVariant(variant: RocketModelVariant) {
    rocketScaleRoot.scale.setScalar(getRocketTargetScaleRatio(variant));
    rocketVisual.setVariant(variant);
  }

  setRocketModelVariant("saturn-v");

  return {
    scene,
    camera,
    frame,
    rocket,
    setRocketModelVariant,
    sizePx: 132,
  };
}

export function createVectorIndicator(): VectorIndicatorBundle {
  const { scene, camera, frame } = createIndicatorScene();

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    VECTOR_ARROW_LENGTH,
    0xffffff,
    0.34,
    0.2,
  );
  frame.add(arrow);

  const { sprite: valueLabel, setText: setValueLabel } =
    createIndicatorValueLabel("0.00 km/s");
  valueLabel.position.copy(VECTOR_VALUE_LABEL_POSITION);
  scene.add(valueLabel);

  return {
    scene,
    camera,
    frame,
    arrow,
    arrowLength: VECTOR_ARROW_LENGTH,
    setValueLabel,
    sizePx: 132,
  };
}

function createIndicatorScene(): IndicatorSceneBundle {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 5.4);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xd7ebff, 0.95);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  const frame = new THREE.Group();
  scene.add(frame);

  const axes = new THREE.AxesHelper(2.6);
  frame.add(axes);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.018, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.2,
    }),
  );
  orbitRing.rotation.x = Math.PI / 2;
  frame.add(orbitRing);

  return {
    scene,
    camera,
    frame,
  };
}

function createIndicatorValueLabel(initialText: string): {
  sprite: THREE.Sprite;
  setText: (text: string) => void;
} {
  // **Increase canvas resolution**
  const canvas = document.createElement("canvas");
  const CANVAS_WIDTH = 1024; // bigger for sharp text
  const CANVAS_HEIGHT = 256;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context unavailable.");
  const labelContext = context;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter; // avoids blur when scaled down
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 10;

  // **Scale sprite down in 3D space**
  const SPRITE_WIDTH = 1.45;
  const SPRITE_HEIGHT = 0.42;
  sprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);

  function setText(text: string) {
    // --- Constants ---
    const PADDING_X = 30;
    const PADDING_Y = 80;
    const BORDER_RADIUS = 32;
    const STROKE_WIDTH = 6;
    const TEXT_FONT_SIZE = 64;
    const LABEL_Y_SHIFT = 20;

    // Compute rectangle position
    const rectX = PADDING_X;
    const rectY = PADDING_Y + LABEL_Y_SHIFT;
    const rectWidth = CANVAS_WIDTH - 2 * PADDING_X;
    const rectHeight = CANVAS_HEIGHT - 2 * PADDING_Y - LABEL_Y_SHIFT; // adjust height

    // Clear canvas
    labelContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background rectangle
    labelContext.fillStyle = "rgba(7, 17, 31, 0.72)";
    roundRect(labelContext, rectX, rectY, rectWidth, rectHeight, BORDER_RADIUS);
    labelContext.fill();

    // Draw border
    labelContext.strokeStyle = "rgba(255, 255, 255, 0.18)";
    labelContext.lineWidth = STROKE_WIDTH;
    labelContext.stroke();

    // Draw text centered inside the rectangle
    labelContext.font = `bold ${TEXT_FONT_SIZE}px monospace`;
    labelContext.textAlign = "center";
    labelContext.textBaseline = "middle";
    labelContext.fillStyle = "rgba(255, 255, 255, 0.96)";
    labelContext.fillText(text, rectX + rectWidth / 2, rectY + rectHeight / 2);

    // Update texture
    texture.needsUpdate = true;
  }

  setText(initialText);

  return {
    sprite,
    setText,
  };
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
