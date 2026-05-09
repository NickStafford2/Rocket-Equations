import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import dracoDecoderJsUrl from "three/examples/jsm/libs/draco/gltf/draco_decoder.js?url";

const DRACO_DECODER_PATH = dracoDecoderJsUrl.replace(
  /draco_decoder\.js(?:\?.*)?$/,
  "",
);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: "js" });
dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const sceneCache = new Map<string, Promise<THREE.Group>>();

export function loadGltfScene(url: string): Promise<THREE.Group> {
  let scenePromise = sceneCache.get(url);

  if (!scenePromise) {
    scenePromise = new Promise<THREE.Group>((resolve, reject) => {
      gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    });

    sceneCache.set(url, scenePromise);
  }

  return scenePromise.then((scene) => scene.clone(true));
}
