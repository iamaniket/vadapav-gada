/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import { ACESFilmicToneMapping, AmbientLight, BoxGeometry, PerspectiveCamera, PMREMGenerator, sRGBEncoding } from "three";
import { MeshLambertMaterial } from "three/src/materials/MeshLambertMaterial";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { Mesh } from "three/src/objects/Mesh";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { Color } from "three/src/math/Color";
import { loadModel } from "./ModelLoader";
import { RoomEnvironment } from "../lib/RoomEnvironment.js";

export class Viewer extends React.Component {

 renderer!: WebGLRenderer;
 camera: PerspectiveCamera;
 scene: Scene;
 controls: any;

 constructor(props: {}) {
  super(props);
  this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
  this.scene = new Scene();
 }

 async componentDidMount() {


  // const geometry = new BoxGeometry(0.2, 0.2, 0.2);
  // const material = new MeshLambertMaterial({ color: new Color(0xff0000) });
  // this.scene.add(new Mesh(geometry, material));

  const wadaPaav = await loadModel("./model/scene.gltf");

  this.scene.add(wadaPaav.scene);


  // Placeholder for light
  const ambientLight = new AmbientLight(0xffffff);
  this.scene.add(ambientLight);

  this.renderer = new WebGLRenderer({ canvas: document.getElementById("viewer-3d") as HTMLCanvasElement, antialias: true, alpha: true });
  this.renderer.setSize(window.innerWidth, window.innerHeight);

  const environment = new RoomEnvironment();
  const pmremGenerator = new PMREMGenerator(this.renderer);
  // this.scene.environment = pmremGenerator.fromScene(environment).texture;

  this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  this.controls.listenToKeyEvents(window); // optional

  this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  this.controls.dampingFactor = 0.05;
  this.controls.screenSpacePanning = false;
  this.controls.minDistance = 0;
  this.controls.maxDistance = 50000;
  this.controls.maxPolarAngle = Math.PI - Math.PI * 1.5 / 4;

  this.renderer.setAnimationLoop(this.animation.bind(this));
  this.renderer.toneMapping = ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 1;
  this.renderer.outputEncoding = sRGBEncoding;

  window.addEventListener("resize", this.onWindowResize.bind(this));
  this.setIsoView()



 }

 onWindowResize() {
  this.camera.aspect =
   window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(
   window.innerWidth,
   window.innerHeight
  );
 }


 setIsoView() {
  var camera = this.camera;
  let box = new Box3().setFromObject(this.scene);
  if (box === undefined) {
   return;
  }

  var center = new Vector3();
  box.getCenter(center);
  if (center === undefined) {
   return;
  }

  this.controls.reset();
  this.controls.target.copy(center);
  var distance = box.min.distanceTo(box.max);

  var dirVec = new Vector3(1, 0, 0);
  var position = center.clone();
  position.addScaledVector(dirVec.normalize(), distance * 0.6);
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
 }

 animation() {
  this.controls.update();
  this.renderer.render(this.scene, this.camera);
 }

 render() {
  return <canvas id="viewer-3d" style={{
   backgroundImage: "url(vadapaavbg.jpg)",
   backgroundRepeat: "no-repeat",
   backgroundSize: "cover"
  }} />
 }
}