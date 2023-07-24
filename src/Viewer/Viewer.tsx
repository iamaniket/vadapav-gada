/*
 Auther : Aniket Wachakawade
 Date   : 04/04/2022
 For three.js base basic viewer component using React(typescript) 
*/

import React from "react";
import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RGBAFormat,
  Raycaster,
  ReinhardToneMapping,
  RepeatWrapping,
  ShapeGeometry,
  ShapePath,
  SphereGeometry,
  SpotLight,
  TextureLoader,
  Vector2,
  WebGLRenderTarget,
  sRGBEncoding,
} from "three";
import { Box3 } from "three/src/math/Box3";
import { Vector3 } from "three/src/math/Vector3";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { Scene } from "three/src/scenes/Scene";
import { OrbitControls } from "../lib/OrbitControls.js";
import { loadFont, loadModel } from "./ModelLoader";
import { SVGLoader } from "../lib/SVGLoader.js";
import { isMobile } from "is-mobile";
import mixpanel from "mixpanel-browser";
import { TextGeometry } from "../lib/TextGeometry";
import TWEEN from "@tweenjs/tween.js";
import { Reflector } from "../lib/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { OutputPass } from "../lib/OutputPass.js";


mixpanel.init("af44aaa9f572d564af1baf30ee1b6b28", { debug: true });

mixpanel.track("Website Visit", {
  source: isMobile() ? "Mobile" : "Personal Computer",
});

const assetUrl = "https://raw.githubusercontent.com/iamaniket/vadapav-gada/main/public/";

interface IProps {}

interface IState {
  isNight: boolean;
}

export class Viewer extends React.Component<IProps, IState> {
  font: any;
  oldMaterial: Material | undefined = undefined;
  raycaster = new Raycaster();
  pointer = new Vector2();
  drag = false;
  selectable: Array<Scene> = [];
  renderer!: WebGLRenderer;
  intersected!: (Mesh & { currentHex: number }) | undefined; //bUTTONS
  phonePosition: Vector3 = new Vector3(60, 310, -365);
  qrPosition: Vector3 = new Vector3(280, 310, 320);
  sampleBordPosition: Vector3 = new Vector3(-550, 0, -670);
  camera: PerspectiveCamera;
  scene: Scene;
  lights: Object3D;
  controls: any;
  groundMirror: Reflector;
  composer!: EffectComposer;
  effectFXAA!: ShaderPass;
  outlinePass!: OutlinePass;
  selectedObjects: Array<Object3D> = [];

  constructor(props: {}, state: { isNight: boolean }) {
    super(props);

    this.state = {
      isNight: true,
    };
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.scene = new Scene();
    this.lights = new Object3D();
    this.scene.add(this.lights);

    this.scene.background = this.state.isNight
      ? new Color(0x000000)
      : new Color(0xffffff);
    // this.scene.fog = new Fog(0xa8d1ed, 1, 10000);

    const geometry = new CircleGeometry(5000, 256);
    this.groundMirror = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0xb5b5b5,
    });

    this.groundMirror.position.y = 0.5;
    this.groundMirror.rotateX(-Math.PI / 2);
  }

  addBase() {
    const plane = new Mesh(
      new PlaneGeometry(100000, 100000),
      new MeshLambertMaterial({ color: 0x82898c, depthWrite: true })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.name = "base";
    this.scene.add(plane);
  }

  createSpotLight(
    position: Vector3,
    target: Vector3,
    intencity: number,
    distance: number
  ) {
    const spotLight = new SpotLight(0xffffff, intencity, distance);
    spotLight.position.copy(position);
    this.scene.add(spotLight);
    const targetObject = new Object3D();
    this.scene.add(targetObject);
    targetObject.position.copy(target);
    targetObject.updateMatrix();
    spotLight.target = targetObject;
    spotLight.target.updateMatrixWorld();
  }

  addDirectionaLight(lightHolder: Object3D) {
    const dirLight = new DirectionalLight(0xffffff, 2.2);
    lightHolder.add(dirLight);
    dirLight.position.set(900, 900, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;

    const dirLight2 = new DirectionalLight(0xffffff, 2.2);
    lightHolder.add(dirLight2);
    dirLight2.position.set(-900, 900, 0);
    dirLight2.castShadow = true;
    dirLight2.shadow.camera.top = 2;
    dirLight2.shadow.camera.bottom = -2;
    dirLight2.shadow.camera.left = -2;
    dirLight2.shadow.camera.right = 2;
    dirLight2.shadow.camera.near = 0.1;
    dirLight2.shadow.camera.far = 40;
  }

  paymentLight(lightHolder: Object3D) {
    const light1 = new PointLight(0xffffff, 6, 500);
    light1.position.set(290, 400, 330);
    lightHolder.add(light1);
  }

  thelaLight(lightHolder: Object3D) {
    const sphere = new SphereGeometry(14, 16, 8);
    const light1 = new PointLight(0xfc0fc0, 5, 1000);
    light1.add(new Mesh(sphere, new MeshBasicMaterial({ color: 0xfc0fc0 })));
    light1.position.set(5, 594, 5.5);
    lightHolder.add(light1);
  }

  bannerLight(lightHolder: Object3D) {
    const bulb = new SpotLight(0xffffff, 0.8);
    bulb.position.set(650, 200, 1000);
    lightHolder.add(bulb);
    const targetObject = new Object3D();
    lightHolder.add(targetObject);
    targetObject.position.set(0, 0, 0);
    targetObject.updateMatrix();
    bulb.target = targetObject;
    bulb.target.updateMatrixWorld();

    // lightHolder.add(new SpotLightHelper(bulb, 0xff0000));
  }

  streetLight(lightHolder: Object3D) {
    const sphere = new BoxGeometry(85, 15, 70);
    const light1 = new PointLight(0xeb7f11, 4);
    light1.add(new Mesh(sphere, new MeshBasicMaterial({ color: 0xeb7f00 })));
    light1.position.set(-95, 1625, -586);
    lightHolder.add(light1);
  }

  createLogoFromPath(paths: Array<ShapePath>, center: Vector3): Group {
    const group = new Group();

    let color = new Color();

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      const material = new MeshBasicMaterial({
        color: path.color,
        side: BackSide,
      });

      color.set(path.color);

      const shapes = SVGLoader.createShapes(path);

      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new ShapeGeometry(shape);
        const mesh = new Mesh(geometry, material);
        group.add(mesh);
      }
    }

    const sphere = new SphereGeometry(14, 16, 8);
    const light1 = new PointLight(color, 5, 1055);
    light1.add(new Mesh(sphere, new MeshBasicMaterial({ color: color })));
    light1.position.set(center.x + 10, center.y, center.z);
    // this.scene.add(light1);

    return group;
  }

  async addText(scene: Scene, text: string) {
    const textGeo = new TextGeometry(text, {
      font: this.font,
      size: 0.6,
      height: 0.15,
      curveSegments: 7,
      bevelThickness: 2,
      bevelSize: 1.5,
    });
    const linkedinLogo = new Mesh(
      textGeo,
      new MeshStandardMaterial({
        color: new Color(0x000000),
        side: DoubleSide,
      })
    );
    linkedinLogo.rotateX(-Math.PI / 2);
    linkedinLogo.position.copy(new Vector3(-2.5, 0.2, 0.25));
    scene.add(linkedinLogo);
  }

  async addLogo(scene: Scene, path: string) {
    const box = new Box3();
    box.setFromObject(scene);
    let center = new Vector3();
    box.getCenter(center);

    const model = (await loadModel(path)) as { paths: Array<ShapePath> };
    const modelLogo = this.createLogoFromPath(model.paths, scene.position);

    modelLogo.rotateX(Math.PI / 2);
    modelLogo.scale.copy(new Vector3(0.071, 0.071, 0.071));
    modelLogo.position.copy(new Vector3(-0.85, 0.2, -0.85));

    scene.add(modelLogo);
  }

  async createLogoHolder(name: string): Promise<Scene> {
    // add logoholder
    const logoHolder = (await loadModel(
      assetUrl + "model/" + name + ".glb"
    )) as {
      scene: Scene;
    };
    (logoHolder.scene.children[0] as Mesh).material = new MeshBasicMaterial({
      color: 0xffffff,
    });

    logoHolder.scene.castShadow = true;
    logoHolder.scene.rotateX(Math.PI / 2);
    logoHolder.scene.rotateZ(-Math.PI / 2);
    logoHolder.scene.scale.copy(new Vector3(45, 45, 45));
    return logoHolder.scene;
  }

  async createInfo() {
    // PROJECTS
    const textHolder1 = await this.createLogoHolder("nameholder");
    textHolder1.name = "PROJECTS";
    textHolder1.position.copy(new Vector3(310, 180, -215));
    await this.addText(textHolder1, "PROJECTS");
    this.scene.add(textHolder1);
    this.selectable.push(textHolder1);
    // CREDITS
    const textHolder2 = await this.createLogoHolder("nameholder");
    textHolder2.name = "CREDITS";
    textHolder2.position.copy(new Vector3(310, 100, -215));
    await this.addText(textHolder2, "CREDITS");
    this.scene.add(textHolder2);
    this.selectable.push(textHolder2);
  }

  async createLinks() {
    // Likedin Logo
    const logoHolder1 = await this.createLogoHolder("logoholder");
    logoHolder1.name = "linkedin";
    logoHolder1.position.copy(new Vector3(305, 180, 300));
    await this.addLogo(logoHolder1, assetUrl + "model/linkedin.svg");
    this.scene.add(logoHolder1);
    this.selectable.push(logoHolder1);

    const logoHolder2 = await this.createLogoHolder("logoholder");

    logoHolder2.name = "email";
    logoHolder2.position.copy(new Vector3(305, 85, 300));
    await this.addLogo(logoHolder2, assetUrl + "model/email.svg");
    this.scene.add(logoHolder2);
    this.selectable.push(logoHolder2);

    const logoHolder3 = await this.createLogoHolder("logoholder");
    logoHolder3.name = "github";
    logoHolder3.position.copy(new Vector3(305, 180, 180));
    await this.addLogo(logoHolder3, assetUrl + "model/github.svg");
    this.scene.add(logoHolder3);
    this.selectable.push(logoHolder3);

    const logoHolder4 = await this.createLogoHolder("logoholder");
    logoHolder4.name = "document";
    logoHolder4.position.copy(new Vector3(305, 85, 180));
    await this.addLogo(logoHolder4, assetUrl + "model/document.svg");
    this.scene.add(logoHolder4);
    this.selectable.push(logoHolder4);
  }

  async componentDidMount() {
    this.font = await loadFont("helvetiker_bold.typeface.json");
    // this.addBase();
    this.createLinks();
    this.createInfo();

    // add badli for water
    const badli = (await loadModel(assetUrl + "model/gada/badli.gltf")) as {
      scene: Scene;
    };
    badli.scene.position.set(-120, 0, 500);
    badli.scene.castShadow = false;
    // wadaPaav.scene.MA = true;
    badli.scene.receiveShadow = false;
    this.scene.add(badli.scene);

    // add badli for water
    const badli2 = (await loadModel(assetUrl + "model/gada/badli.gltf")) as {
      scene: Scene;
    };
    badli2.scene.position.set(-120, 680, 300);
    badli2.scene.castShadow = false;
    // wadaPaav.scene.MA = true;
    badli2.scene.receiveShadow = false;
    this.scene.add(badli2.scene);

    // add gada
    const wadaPaav = (await loadModel(assetUrl + "model/gada/scene.gltf")) as {
      scene: Scene;
    };
    wadaPaav.scene.castShadow = true;
    // wadaPaav.scene.MA = true;
    wadaPaav.scene.receiveShadow = true;
    this.scene.add(wadaPaav.scene);

    // add phone
    const phone = (await loadModel(assetUrl + "model/phone/scene.gltf")) as {
      scene: Scene;
    };
    phone.scene.castShadow = true;
    phone.scene.receiveShadow = true;
    phone.scene.rotateX(Math.PI / 2);
    phone.scene.rotateZ(-Math.PI / 3);
    phone.scene.scale.copy(new Vector3(100, 100, 100));
    phone.scene.position.copy(this.phonePosition);
    // this.scene.add(phone.scene);

    // add QR code
    const qr = (await loadModel(assetUrl + "model/qr.glb")) as { scene: Scene };
    qr.scene.name = "PAYMENT"
    qr.scene.castShadow = true;
    phone.scene.receiveShadow = true;
    // qr.scene.rotateX(Math.PI / 2);
   // qr.scene.rotateY(Math.PI - Math.PI / 10);
    qr.scene.scale.copy(new Vector3(6, 6, 6));
    qr.scene.position.copy(this.qrPosition);
    this.scene.add(qr.scene);
    this.selectable.push(qr.scene);

    // add sample work bord
    const sampleBord = (await loadModel(
      assetUrl + "model/sampleideas.glb"
    )) as { scene: Scene };
    sampleBord.scene.castShadow = true;
    phone.scene.receiveShadow = true;
    // qr.scene.rotateX(Math.PI / 2);
    sampleBord.scene.rotateY(Math.PI / 2);
    sampleBord.scene.scale.copy(new Vector3(4, 4, 4));
    sampleBord.scene.position.copy(this.sampleBordPosition);
    this.scene.add(sampleBord.scene);
    this.selectable.push(sampleBord.scene);

    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("viewer-3d") as HTMLCanvasElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.updateLights();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.listenToKeyEvents(window); // optional

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 2600;
    this.controls.maxPolarAngle = Math.PI - (Math.PI * 1.5) / 3.7;

    const renderScene = new RenderPass(this.scene, this.camera);

    const outputPass = new OutputPass(ReinhardToneMapping);
    outputPass.toneMappingExposure = 0.5;

    const gl = document.createElement("canvas").getContext("webgl2");

    // let target;
    // if (gl) {
    //   target = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    //     format: RGBAFormat,
    //     encoding: sRGBEncoding,
    //   });
    //   target.samples = 8;
    //   this.composer = new EffectComposer(this.renderer, target);
    // } else {
    //   
    // }

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(window.devicePixelRatio);

    this.composer.addPass(renderScene);
    // this.composer.addPass( outputPass );

    this.outlinePass = new OutlinePass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.composer.addPass(this.outlinePass);

    const textureLoader = new TextureLoader();
    textureLoader.load("textures/tri_pattern.jpg", (texture) => {
      this.outlinePass.patternTexture = texture;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    });

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(this.effectFXAA);

    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("pointermove", this.onPointerMove.bind(this));
    window.addEventListener("mousedown", this.onPointerDown.bind(this));
    window.addEventListener("mouseup", this.onPointerUp.bind(this));

    this.setIsoView();

    const element = document.getElementById("loader-holder");

    if (element) {
      element.parentNode?.removeChild(element);
    }

    this.scene.add(this.groundMirror);
    this.animate();
  }

  updateLights() {
    if (this.state.isNight) {
      this.paymentLight(this.lights);
      this.bannerLight(this.lights);
      this.thelaLight(this.lights);
      this.streetLight(this.lights);
    } else {
      this.addDirectionaLight(this.lights);
    }
  }

  onPointerDown() {
    this.drag = false;
  }

  onPointerUp(event: MouseEvent) {
    if (!this.drag) {
      this.drag = true;
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.intersect();
      if (this.intersected) {
        switch (this.intersected.name) {
          case "PAYMENT":
            mixpanel.track("Payment", {});
            new TWEEN.Tween(this.camera.position)
            .to({ x: 896, y: 504, z: 16 }, 1000)
            .start();
            break;
          case "CREDITS":
            mixpanel.track("Credits", {});
            //@ts-ignore
            window
              .open("https://sketchfab.com/mrinalkukreti", "_blank")
              .focus();
            break;
          case "PROJECTS":
            new TWEEN.Tween(this.camera.position)
              .to({ x: -1339, y: 115, z: -2211 }, 1500)
              .start();
            mixpanel.track("Projects", {});
            break;
          case "EXPERIENCE":
            new TWEEN.Tween(this.camera.position)
              .to({ x: 0.000161988, y: 1000.804784, z: 0.0000016 }, 1000)
              .start();
            mixpanel.track("Location", {});
            break;
          // case "ABOUT":
          //   new TWEEN.Tween(this.camera.position).to({x: -783, y: 73, z: -1673}, 1000).start();
          //  break;
          case "runlola":
            //@ts-ignore
            window
              .open("https://aniketwachakawade.com/examples/promaton", "_blank")
              .focus();
            break;

          case "motercycle":
            mixpanel.track("Project: Motercycle", {});
            //@ts-ignore
            window
              .open(
                "https://aniketwachakawade.com/examples/motorcyclecatalog",
                "_blank"
              )
              .focus();
            break;
          case "saree":
          case "sareebord":
            mixpanel.track("Project: Sareebord", {});
            //@ts-ignore
            window
              .open(
                "https://aniketwachakawade.com/examples/saree_viewer",
                "_blank"
              )
              .focus();
            break;
          case "linkedin":
            mixpanel.track("Linkedin", {});
            //@ts-ignore
            window
              .open("https://www.linkedin.com/in/aniketwachakawade/", "_blank")
              .focus();
            break;
          case "github":
            mixpanel.track("Github", {});
            //@ts-ignore
            window.open("https://github.com/iamaniket", "_blank").focus();
            break;
          case "email":
            mixpanel.track("Email", {});
            window.location.href = "mailto:aniketgw47@gmail.com";
            break;
          case "document":
            mixpanel.track("Resume", {});
            //@ts-ignore
            window
              .open(
                "https://docs.google.com/document/d/0B30jU9482vabdlZVa0VhV1FOanlDbFBqXzZ2cjR2eS1wMUpB/edit?resourcekey=0-GbeJhsn2vmJ0mqhvO2wCWg",
                "_blank"
              )
              .focus();
        }
      }
    }
  }

  onPointerMove(event: MouseEvent) {
    this.drag = true;
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
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
    if (objectCheck === -1) {
      objectCheck = object.name.search("run");
    }

    if (objectCheck > -1) {
      if (this.intersected !== object) {

        this.intersected = object as Mesh & { currentHex: number };

        if (!isMobile()) {
          const selectedObject = object;
          this.addSelectedObject(selectedObject);
          this.outlinePass.selectedObjects = this.selectedObjects;
        }
      }
      return;
    }

    const parrentNode = this.getParentRecrcive(object) as Mesh;
    if (this.intersected !== parrentNode) {

      this.intersected = parrentNode.children[1] as Mesh & {
        currentHex: number;
      };
      this.intersected.name = parrentNode.name;

      if (!isMobile()) {
        const selectedObject = this.intersected;
        this.addSelectedObject(selectedObject);
        this.outlinePass.selectedObjects = this.selectedObjects;
      }
    }
  }

  addSelectedObject(object: Object3D) {
    this.selectedObjects = [];
    this.selectedObjects.push(object);
  }

  intersect() {
    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.selectable);

    if (intersects.length > 0) {
      this.actOnIntersection(intersects[0].object);
    } else {
        this.outlinePass.selectedObjects = [];      
        this.intersected = undefined;
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.intersect();
    TWEEN.update();
    this.composer.render();
    this.scene.rotateOnAxis(new Vector3(0,1,0), 0.001);
  }

  render() {
    return (
      <>
        <canvas id="viewer-3d" />
        <button
          className="float"
          onClick={() => {
            mixpanel.track("mode toggle", {});
            this.setState(
              { isNight: this.state.isNight ? false : true },
              () => {
                // Update Scene after chnage
                this.scene.background = this.state.isNight
                  ? new Color(0x000000)
                  : new Color(0xbbbbbb);
                // remove all lights
                this.lights.remove(...this.lights.children);
                this.updateLights();
              }
            );
          }}
        >
          <img
            src={this.state.isNight ? "day.png" : "night.png"}            
            className="icon"
            alt=""
          />
        </button>
      </>
    );
  }
}
