import { Scene } from "three";
import { GLTFLoader } from "../lib/GLTFLoader";

const gLTFLoader = new GLTFLoader();

export function loadGltf(
  modelUrl: string,
  onLoad: (gltf: { scene: Scene }) => void,
  onProgress?: (progress: ProgressEvent<EventTarget>) => void,
  onError?: (error: ErrorEvent) => void
): void {
  gLTFLoader.load(modelUrl, onLoad, onProgress, onError);
}

export function loadModel(fileName: string): Promise<{ scene: Scene }> {
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
