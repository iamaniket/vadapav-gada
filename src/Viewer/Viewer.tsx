/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import {
  ACESFilmicToneMapping, BackSide, CircleGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera,
  PMREMGenerator, Raycaster, ReinhardToneMapping, ShapeGeometry, ShapePath, SpotLight, sRGBEncoding, Vector2
} from "three";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { loadModel } from "./ModelLoader";
import { RoomEnvironment } from "../lib/RoomEnvironment.js";
import { SVGLoader } from "../lib/SVGLoader.js";

const assetUrl = "https://raw.githubusercontent.com/iamaniket/vadapav-gada/main/public/"

export class Viewer extends React.Component {

  raycaster = new Raycaster();
  pointer = new Vector2();
  drag = false;
  selectable: Array<Scene> = [];
  renderer!: WebGLRenderer;
  intersected!: Mesh & { currentHex: number } | undefined;//bUTTONS
  phonePosition: Vector3 = new Vector3(60, 310, -365);
  qrPosition: Vector3 = new Vector3(280, 310, 320);
  sampleBordPosition: Vector3 = new Vector3(-550, 0, -670);
  camera: PerspectiveCamera;
  scene: Scene;
  controls: any;
  isNight = new Date().getHours() < 6 || new Date().getHours() >= 19;


  constructor(props: {}) {
    super(props);
    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    this.scene = new Scene();
  }

  addBase() {
    const geometry = new CircleGeometry(1500, 32);
    geometry.rotateX(Math.PI / 2);
    const material = new MeshStandardMaterial({ color: 0xa86b32, side: BackSide, opacity: 0.5 });
    const plane = new Mesh(geometry, material);
    plane.receiveShadow = true;
    plane.castShadow = true;
    plane.name = "base"
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
    bulb.castShadow = true;
    bulb.shadow.bias = -0.0001;
    bulb.shadow.mapSize.width = 1024 * 4;
    bulb.shadow.mapSize.height = 1024 * 4;
    this.scene.add(bulb);
    const targetObject = new Object3D();
    this.scene.add(targetObject);
    targetObject.position.set(-100, 0, -580);
    targetObject.updateMatrix()
    bulb.target = targetObject;
    bulb.target.updateMatrixWorld();
    this.createSpotLight(new Vector3(-100, 1550, -580), new Vector3(-100, 1850, -580), 100, 100);
  }

  createLogoFromPath(paths: Array<ShapePath>): Group {
    const group = new Group();

    for (let i = 0; i < paths.length; i++) {

      const path = paths[i];

      const material = new MeshStandardMaterial({
        color: path.color,
        side: DoubleSide
      });

      const shapes = SVGLoader.createShapes(path);

      for (let j = 0; j < shapes.length; j++) {

        const shape = shapes[j];
        const geometry = new ShapeGeometry(shape);
        const mesh = new Mesh(geometry, material);
        group.add(mesh);

      }
    }

    return group

  }

  async addLogo(scene: Scene, path: string) {
    const linkedin = await loadModel(path) as { paths: Array<ShapePath> };
    const linkedinLogo = this.createLogoFromPath(linkedin.paths);
    linkedinLogo.rotateX(Math.PI / 2);
    linkedinLogo.scale.copy(new Vector3(0.071, 0.071, 0.071));
    linkedinLogo.position.copy(new Vector3(-0.85, 0.2, -0.85));
    scene.add(linkedinLogo);
  }

  async createLogoHolder(): Promise<Scene> {
    // add logoholder
    const logoHolder = await loadModel(assetUrl + "model/logoholder.glb") as { scene: Scene };
    logoHolder.scene.castShadow = true;
    logoHolder.scene.rotateX(Math.PI / 2);
    logoHolder.scene.rotateZ(-Math.PI / 2);
    logoHolder.scene.scale.copy(new Vector3(45, 45, 45));

    return logoHolder.scene;
  }


  async createLinks() {

    // Likedin Logo
    const logoHolder1 = await this.createLogoHolder();
    logoHolder1.name = "linkedin";
    logoHolder1.position.copy(new Vector3(305, 180, 300));
    await this.addLogo(logoHolder1, assetUrl + "model/linkedin.svg");
    this.scene.add(logoHolder1);
    this.selectable.push(logoHolder1);

    const logoHolder2 = await this.createLogoHolder();

    logoHolder2.name = "email";
    logoHolder2.position.copy(new Vector3(305, 85, 300));
    await this.addLogo(logoHolder2, assetUrl + "model/email.svg");
    this.scene.add(logoHolder2);
    this.selectable.push(logoHolder2);

    const logoHolder3 = await this.createLogoHolder();
    logoHolder3.name = "github";
    logoHolder3.position.copy(new Vector3(305, 180, 180));
    await this.addLogo(logoHolder3, assetUrl + "model/github.svg");
    this.scene.add(logoHolder3);
    this.selectable.push(logoHolder3);

    const logoHolder4 = await this.createLogoHolder();
    logoHolder4.name = "document";
    logoHolder4.position.copy(new Vector3(305, 85, 180));
    await this.addLogo(logoHolder4, assetUrl + "model/document.svg");
    this.scene.add(logoHolder4);
    this.selectable.push(logoHolder4);

  }

  async componentDidMount() {

    this.addBase();
    this.createLinks();



    // add gada
    const wadaPaav = await loadModel(assetUrl + "model/gada/scene.gltf") as { scene: Scene };
    wadaPaav.scene.castShadow = true;
    // wadaPaav.scene.MA = true;
    wadaPaav.scene.receiveShadow = true;
    this.scene.add(wadaPaav.scene);

    // add phone
    const phone = await loadModel(assetUrl + "model/phone/scene.gltf") as { scene: Scene };
    phone.scene.castShadow = true;
    phone.scene.rotateX(Math.PI / 2);
    phone.scene.rotateZ(-Math.PI / 3);
    phone.scene.scale.copy(new Vector3(100, 100, 100));
    phone.scene.position.copy(this.phonePosition);
    this.scene.add(phone.scene);

    // add QR code 
    const qr = await loadModel(assetUrl + "model/qr.glb") as { scene: Scene };
    qr.scene.castShadow = true;
    // qr.scene.rotateX(Math.PI / 2);
    qr.scene.rotateY(Math.PI - Math.PI / 10);
    qr.scene.scale.copy(new Vector3(6, 6, 6));
    qr.scene.position.copy(this.qrPosition);
    this.scene.add(qr.scene);


    // add sample work bord
    const sampleBord = await loadModel(assetUrl + "model/sampleideas.glb") as { scene: Scene };
    sampleBord.scene.castShadow = true;
    // qr.scene.rotateX(Math.PI / 2);
    sampleBord.scene.rotateY(Math.PI / 2);
    sampleBord.scene.scale.copy(new Vector3(4, 4, 4));
    sampleBord.scene.position.copy(this.sampleBordPosition);
    this.scene.add(sampleBord.scene);
    this.selectable.push(sampleBord.scene);



    this.renderer = new WebGLRenderer({ canvas: document.getElementById("viewer-3d") as HTMLCanvasElement, antialias: true, alpha: true });
    this.renderer.toneMapping = ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.2;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    if (this.isNight) {
      this.bannerLight();
      this.thelaLight();
      this.streetLight();
    } else {
      const environment = new RoomEnvironment();
      const pmremGenerator = new PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(environment).texture;
    }

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
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('mousedown', this.onPointerDown.bind(this));
    window.addEventListener('mouseup', this.onPointerUp.bind(this));

    this.setIsoView();

    const element = document.getElementById("loader-holder");

    if (element) {
      element.parentNode?.removeChild(element);
    }

  }

  onPointerDown() {
    this.drag = false;
  }

  onPointerUp(event: MouseEvent) {
    if (!this.drag) {

      this.drag = true;
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

      this.intersect();

      if (this.intersected) {
        switch (this.intersected.name) {
          case "moter":
          case "motercycle":
            //@ts-ignore
            window.open("https://aniketwachakawade.com/examples/motorcyclecatalog", '_blank').focus();
            break;
          case "saree":
          case "sareebord":
            //@ts-ignore
            window.open("https://aniketwachakawade.com/examples/saree_viewer", '_blank').focus();
            break;
          case "linkedin":
            //@ts-ignore
            window.open("https://www.linkedin.com/in/aniketwachakawade/", '_blank').focus();
            break;
          case "github":
            //@ts-ignore
            window.open("https://github.com/iamaniket", '_blank').focus();
            break;
          case "email":
            window.location.href = "mailto:aniketgw47@gmail.com";
            break;
          case "document":
            //@ts-ignore
            window.open("https://docs.google.com/document/d/0B30jU9482vabdlZVa0VhV1FOanlDbFBqXzZ2cjR2eS1wMUpB/edit?resourcekey=0-GbeJhsn2vmJ0mqhvO2wCWg", '_blank').focus();
        }
      }
    }
  }

  onPointerMove(event: MouseEvent) {
    this.drag = true;
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
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


  getParentRecrcive(object: Object3D): Object3D {
    if (object.parent && object.parent.parent) {
      return this.getParentRecrcive(object.parent);
    }
    return object;
  }

  actOnIntersection(object: Object3D, isClick = false) {
    let objectCheck = object.name.search("noricebord");
    if (objectCheck !== -1) {
      return;
    }
    objectCheck = object.name.search("moter");
    if (objectCheck === -1) {
      objectCheck = object.name.search("saree");
    }

    if (objectCheck > -1) {

      if (this.intersected !== object) {
        //@ts-ignore
        if (this.intersected) this.intersected.material.color.setHex(this.intersected.currentHex);
        this.intersected = object as Mesh & { currentHex: number };

        //@ts-ignore
        const material = object.material as MeshBasicMaterial;
        //@ts-ignore
        this.intersected.currentHex = material.color.getHex();
        material.color.setHex(0x0045a6);
      }
      return;
    }

    const parrentNode = this.getParentRecrcive(object) as Mesh;
    if (this.intersected !== parrentNode) {
      //@ts-ignore
      if (this.intersected) this.intersected.material.color.setHex(this.intersected.currentHex);
      this.intersected = parrentNode.children[1] as Mesh & { currentHex: number };
      this.intersected.name = parrentNode.name;

      //@ts-ignore
      const material = this.intersected.material as MeshBasicMaterial;
      this.intersected.currentHex = material.color.getHex();
      material.color.setHex(0x0045a6);
    }
  }

  intersect() {
    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.selectable);

    if (intersects.length > 0) {
      this.actOnIntersection(intersects[0].object);
    } else {
      if (this.intersected) {
        //@ts-ignore
        this.intersected.material.color.setHex(0xffffff);
        this.intersected = undefined;
      }
    }
  }



  animation() {
    this.controls.update();
    this.intersect();
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return <canvas id="viewer-3d" style={{ background: this.isNight ? "rgba(0, 0, 0, 0.92)" : "" }} />
  }
}