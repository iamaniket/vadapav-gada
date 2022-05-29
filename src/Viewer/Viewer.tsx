/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import { ACESFilmicToneMapping, AmbientLight, BackSide, CircleGeometry, DirectionalLight, DirectionalLightHelper, DoubleSide, FrontSide, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, PointLightHelper, SpotLight, SpotLightHelper, sRGBEncoding } from "three";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { loadModel } from "./ModelLoader";
import { RoomEnvironment } from "../lib/RoomEnvironment.js";

export class Viewer extends React.Component {

 renderer!: WebGLRenderer;
 phonePosition: Vector3 = new Vector3(60, 310, -365);
 camera: PerspectiveCamera;
 scene: Scene;
 controls: any;
 isNight = new Date().getHours() < 6 || new Date().getHours() >= 19;
 /// To add switch for night and dar mode

 constructor(props: {}) {
  super(props);
  this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  this.scene = new Scene();
 }

 addBase() {
  const geometry = new CircleGeometry(1500, 32);
  geometry.rotateX(Math.PI / 2)

  const material = new MeshStandardMaterial({ color: 0xa86b32, side: BackSide, opacity: 0.5 });
  const plane = new Mesh(geometry, material);
  plane.receiveShadow = true;
  plane.castShadow = true;
  this.scene.add(plane);
 }

 createSpotLight(position: Vector3, target: Vector3, intencity: number, distance: number) {
  const spotLight = new SpotLight(0xffffff, intencity, distance);
  spotLight.position.copy(position);
  this.scene.add(spotLight);
  const targetObject = new Object3D();
  this.scene.add(targetObject);
  targetObject.position.copy(target);
  targetObject.updateMatrix()
  spotLight.target = targetObject;
  spotLight.target.updateMatrixWorld();
 }



 thelaLight() {
  // Balb inside thela down
  const thelaBulb = new SpotLight(0xffff00, 5, 500);
  thelaBulb.position.set(0, 600, 0);
  this.scene.add(thelaBulb);
  this.createSpotLight(new Vector3(-50, 575, 0), new Vector3(50, 575, 0), 100, 50);
  this.createSpotLight(new Vector3(50, 575, 0), new Vector3(-50, 575, 0), 100, 50);
  this.createSpotLight(new Vector3(0, 575, 50), new Vector3(0, 575, -50), 100, 50);
  this.createSpotLight(new Vector3(0, 575, -50), new Vector3(0, 575, 50), 100, 50);
 }

 bannerLight() {
  const bulb = new SpotLight(0xffffff, 0.5, 2100);
  bulb.position.set(800, 0, 800);
  this.scene.add(bulb);
  const targetObject = new Object3D();
  this.scene.add(targetObject);
  targetObject.position.set(0, 0, 0);
  targetObject.updateMatrix()
  bulb.target = targetObject;
  bulb.target.updateMatrixWorld();
 }

 streetLight() {
  const bulb = new SpotLight(0xffffff, 4, 2100);
  bulb.position.set(-100, 1650, -580);
  this.scene.add(bulb);
  const targetObject = new Object3D();
  this.scene.add(targetObject);
  targetObject.position.set(-100, 0, -580);
  targetObject.updateMatrix()
  bulb.target = targetObject;
  bulb.target.updateMatrixWorld();
  this.createSpotLight(new Vector3(-100, 1550, -580), new Vector3(-100, 1850, -580), 100, 100);
 }



 async componentDidMount() {
  this.addBase();


  // const geometry = new BoxGeometry(0.2, 0.2, 0.2);
  // const material = new MeshLambertMaterial({ color: new Color(0xff0000) });
  // this.scene.add(new Mesh(geometry, material));


  // add gada
  const wadaPaav = await loadModel("./model/gada/scene.gltf");
  wadaPaav.scene.castShadow = true;
  this.scene.add(wadaPaav.scene);


  // add phone
  const phone = await loadModel("./model/phone/scene.gltf");
  phone.scene.castShadow = true;

  phone.scene.rotateX(Math.PI / 2);
  phone.scene.rotateZ(-Math.PI / 3);
  phone.scene.scale.copy(new Vector3(100, 100, 100));
  phone.scene.position.copy(this.phonePosition);
  this.scene.add(phone.scene);

  // add qr scanner


  // Placeholder for light
  // const ambientLight = new AmbientLight(0xffffff);
  // this.scene.add(ambientLight);

  this.renderer = new WebGLRenderer({ canvas: document.getElementById("viewer-3d") as HTMLCanvasElement, antialias: true, alpha: true });
  this.renderer.setSize(window.innerWidth, window.innerHeight);

  if (this.isNight) {
   this.bannerLight();
   this.thelaLight();
   this.streetLight();
  } else {
   const environment = new RoomEnvironment();
   const pmremGenerator = new PMREMGenerator(this.renderer);
   this.scene.environment = pmremGenerator.fromScene(environment).texture;
  }

  //


  this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  this.controls.listenToKeyEvents(window); // optional

  this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  this.controls.dampingFactor = 0.05;
  this.controls.screenSpacePanning = false;
  this.controls.minDistance = 0;
  this.controls.maxDistance = 2000;
  this.controls.maxPolarAngle = Math.PI - Math.PI * 1.5 / 4;

  this.renderer.setAnimationLoop(this.animation.bind(this));
  this.renderer.toneMapping = ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 1;
  this.renderer.outputEncoding = sRGBEncoding;

  window.addEventListener("resize", this.onWindowResize.bind(this));
  this.setIsoView();

  const element = document.getElementById("loader-holder");

  if (element) {
   element.parentNode?.removeChild(element);
  }

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
  return <canvas id="viewer-3d" style={{ background: this.isNight ? "rgba(0, 0, 0, 0.92)" : "" }} />
 }
}