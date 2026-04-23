import * as THREE from "three";

type BodyLabelStyle = {
  borderColor?: string | null;
};

export function createBodyLabelSprite(
  text: string,
  { borderColor = "rgba(77, 208, 255, 0.7)" }: BodyLabelStyle = {},
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas context unavailable for body label sprite.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(7, 17, 31, 0.72)";
  roundRect(context, 4, 8, canvas.width - 8, canvas.height - 16, 18);
  context.fill();
  if (borderColor) {
    context.strokeStyle = borderColor;
    context.lineWidth = 3;
    context.stroke();
  }

  context.font = "300 100px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(232, 245, 255, 0.96)";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 10;
  sprite.scale.set(18, 6.75, 1);
  return sprite;
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
