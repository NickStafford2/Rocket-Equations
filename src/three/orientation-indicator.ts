import * as THREE from "three";
import type { RocketModelVariant } from "../rocket/definitions";
import { createRocketVisual } from "./objects/rocket/rocket-visual";

const INDICATOR_SIZE_PX = 132;

const INDICATOR_TARGET_SIZE = 1.75;
const VECTOR_ARROW_LENGTH = 1.45;
const VECTOR_VALUE_LABEL_POSITION = new THREE.Vector3(0, -1.28, 0);

const LABEL_CANVAS_WIDTH = 1024;
const LABEL_CANVAS_HEIGHT = 256;
const LABEL_SPRITE_WIDTH = 1.45;
const LABEL_SPRITE_HEIGHT = 0.42;

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
  const rocketVisual = createRocketVisual({
    fitHeightSceneUnits: INDICATOR_TARGET_SIZE,
  });

  rocket.add(rocketVisual.root);
  frame.add(rocket);

  function setRocketModelVariant(variant: RocketModelVariant) {
    rocketVisual.setVariant(variant);
  }

  setRocketModelVariant("saturn-v");

  return {
    scene,
    camera,
    frame,
    rocket,
    setRocketModelVariant,
    sizePx: INDICATOR_SIZE_PX,
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
    sizePx: INDICATOR_SIZE_PX,
  };
}

function createIndicatorScene(): IndicatorSceneBundle {
  const scene = new THREE.Scene();
  const camera = createIndicatorCamera();
  const frame = new THREE.Group();

  scene.add(createIndicatorAmbientLight());
  scene.add(createIndicatorKeyLight());
  scene.add(createIndicatorFillLight());
  scene.add(frame);

  frame.add(new THREE.AxesHelper(2.6));
  frame.add(createOrbitRing());

  return {
    scene,
    camera,
    frame,
  };
}

function createIndicatorCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 5.4);
  camera.lookAt(0, 0, 0);

  return camera;
}

function createIndicatorAmbientLight(): THREE.AmbientLight {
  return new THREE.AmbientLight(0xd7ebff, 0.95);
}

function createIndicatorKeyLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xffffff, 1.4);
  light.position.set(4, 6, 5);

  return light;
}

function createIndicatorFillLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  light.position.set(-4, 2, -3);

  return light;
}

function createOrbitRing(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.018, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.2,
    }),
  );

  ring.rotation.x = Math.PI / 2;

  return ring;
}

function createIndicatorValueLabel(initialText: string): {
  sprite: THREE.Sprite;
  setText: (text: string) => void;
} {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_CANVAS_WIDTH;
  canvas.height = LABEL_CANVAS_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas context unavailable.");
  }

  const labelContext: CanvasRenderingContext2D = context;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
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
  sprite.scale.set(LABEL_SPRITE_WIDTH, LABEL_SPRITE_HEIGHT, 1);

  function setText(text: string) {
    drawIndicatorValueLabel(labelContext, text);
    texture.needsUpdate = true;
  }

  setText(initialText);

  return {
    sprite,
    setText,
  };
}

function drawIndicatorValueLabel(
  context: CanvasRenderingContext2D,
  text: string,
) {
  const paddingX = 30;
  const paddingY = 80;
  const borderRadius = 32;
  const strokeWidth = 6;
  const textFontSize = 64;
  const labelYShift = 20;

  const rectX = paddingX;
  const rectY = paddingY + labelYShift;
  const rectWidth = LABEL_CANVAS_WIDTH - 2 * paddingX;
  const rectHeight = LABEL_CANVAS_HEIGHT - 2 * paddingY - labelYShift;

  context.clearRect(0, 0, LABEL_CANVAS_WIDTH, LABEL_CANVAS_HEIGHT);

  context.fillStyle = "rgba(7, 17, 31, 0.72)";
  roundRect(context, rectX, rectY, rectWidth, rectHeight, borderRadius);
  context.fill();

  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.lineWidth = strokeWidth;
  context.stroke();

  context.font = `bold ${textFontSize}px monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.fillText(text, rectX + rectWidth / 2, rectY + rectHeight / 2);
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
