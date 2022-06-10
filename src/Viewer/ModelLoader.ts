import { Scene, ShapePath } from "three";
import { GLTFLoader } from "../lib/GLTFLoader";
import { SVGLoader } from "../lib/SVGLoader";

const gLTFLoader = new GLTFLoader();
const sVGLoader = new SVGLoader();

export function loadGltf(
  modelUrl: string,
  onLoad: (gltf: { scene: Scene }) => void,
  onProgress?: (progress: ProgressEvent<EventTarget>) => void,
  onError?: (error: ErrorEvent) => void
): void {
  const ext = modelUrl.split(".").pop();

  if (ext?.toLowerCase() === "svg") {
    sVGLoader.load(modelUrl, onLoad, onProgress, onError);
  } else {
    gLTFLoader.load(modelUrl, onLoad, onProgress, onError);
  }
}

export function loadModel(
  fileName: string
): Promise<{ scene: Scene } | { paths: Array<ShapePath> }> {
  return new Promise((resolve, reject) => {
    loadGltf(
      fileName,
      (gltf: { scene: Scene }): void => {
        console.log(`Loading Complete :${fileName}`);
        resolve(gltf);
      },
      (event: ProgressEvent<EventTarget>) => {
        console.log(`Loading model :${fileName}`);
        console.log(event);
      },
      (errorEvent: ErrorEvent) => {
        console.error(`Loading model :${fileName}`);
        console.error(errorEvent);
        reject(errorEvent);
      }
    );
  });
}
