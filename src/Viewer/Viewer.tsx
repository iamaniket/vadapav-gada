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
  ShapeGeometry,
  ShapePath,
  SphereGeometry,
  SpotLight,
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
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../lib/OutputPass.js";
// import { GUI } from "../lib/lil-gui.module.min.js";

mixpanel.init("af44aaa9f572d564af1baf30ee1b6b28", { debug: true });

mixpanel.track("Website Visit", {
  source: isMobile() ? "Mobile" : "Personal Computer",
});

const assetUrl = "";
// "https://raw.githubusercontent.com/iamaniket/vadapav-gada/main/public/";

export class Viewer extends React.Component {
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
  controls: any;
  groundMirror: Reflector;
  composer!: EffectComposer;

  constructor(props: {}) {
    super(props);
    this.camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.scene = new Scene();

    this.scene.background = new Color(0x000000);
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

  thelaLight() {
    const sphere = new SphereGeometry(14, 16, 8);
    const light1 = new PointLight(0xeb7f00, 8, 1000);
    light1.add(new Mesh(sphere, new MeshBasicMaterial({ color: 0xff9619 })));
    light1.position.set(5, 594, 5.5);
    this.scene.add(light1);
  }

  bannerLight() {
    const bulb = new SpotLight(0xffffff, 0.5, 2100);
    bulb.position.set(800, 0, 800);
    this.scene.add(bulb);
    const targetObject = new Object3D();
    this.scene.add(targetObject);
    targetObject.position.set(0, 0, 0);
    targetObject.updateMatrix();
    bulb.target = targetObject;
    bulb.target.updateMatrixWorld();
  }

  streetLight() {
    const sphere = new BoxGeometry(85, 15, 70);
    const light1 = new PointLight(0xacf0f2, 3);
    light1.add(new Mesh(sphere, new MeshBasicMaterial({ color: 0xdbfeff })));
    light1.position.set(-95, 1625, -586);
    this.scene.add(light1);
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

      // console.log(path.color);

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
    light1.position.set(center.x + 10, center.y , center.z );
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

    // EXPERIENCE
    // const textHolder2 = await this.createLogoHolder("nameholder");
    // textHolder2.name = "EXPERIENCE";
    // textHolder2.position.copy(new Vector3(310, 100, -215));
    // await this.addText(textHolder2, "Location");
    // this.scene.add(textHolder2);
    // this.selectable.push(textHolder2);

    // // EXPERIENCE
    // const textHolder3 = await this.createLogoHolder("nameholder");
    // textHolder3.name = "CREDITS";
    // textHolder3.position.copy(new Vector3(310, 80, -215));
    // await this.addText(textHolder3, "CREDITS");
    // this.scene.add(textHolder3);
    // this.selectable.push(textHolder3);
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
    qr.scene.castShadow = true;
    phone.scene.receiveShadow = true;
    // qr.scene.rotateX(Math.PI / 2);
    qr.scene.rotateY(Math.PI - Math.PI / 10);
    qr.scene.scale.copy(new Vector3(6, 6, 6));
    qr.scene.position.copy(this.qrPosition);
    this.scene.add(qr.scene);

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
    // this.renderer.toneMapping = ReinhardToneMapping;
    // this.renderer.toneMappingExposure = 2.2;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // this.scene.add(thelaBulb);awsq4d4w54r54rtrfggfffffffvhuijhgfdxcszassssssssssssssaa bbbbbbbbbbbb333333333333333~~!AAZG

    this.bannerLight();
    this.thelaLight();
    this.streetLight();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.listenToKeyEvents(window); // optional

    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 2000;
    this.controls.maxPolarAngle = Math.PI - (Math.PI * 1.5) / 4;

    // this.renderer.setAnimationLoop(this.animation.bind(this));

    const renderScene = new RenderPass(this.scene, this.camera);

    const bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.95;
    bloomPass.strength = 0.2;
    bloomPass.radius = 0.1;

    const outputPass = new OutputPass(ReinhardToneMapping);
    outputPass.toneMappingExposure = 0.5;

    const gl = document.createElement("canvas").getContext("webgl2");

    let target;
    if (gl) {
      target = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        format: RGBAFormat,
        encoding: sRGBEncoding,
      });
      target.samples = 8;
      this.composer = new EffectComposer(this.renderer, target);
    } else {
      this.composer = new EffectComposer(this.renderer);
    }

    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);

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

    // const gui = new GUI();

    // 		const bloomFolder = gui.addFolder( 'bloom' );

    //     //@ts-ignore
    // 		bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {

    // 			bloomPass.threshold = Number( value );

    // 		} );

    //      //@ts-ignore
    // 		bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {

    // 			bloomPass.strength = Number( value );

    // 		} );

    //      //@ts-ignore
    // 		gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

    // 			bloomPass.radius = Number( value );

    // 		} );

    // 		const toneMappingFolder = gui.addFolder( 'tone mapping' );

    //      //@ts-ignore
    // 		toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

    // 			outputPass.toneMappingExposure = Math.pow( value, 4.0 );

    // 		} );
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
        // console.log(this.intersected.name);
        switch (this.intersected.name) {
          case "PROJECTS":
            new TWEEN.Tween(this.camera.position)
              .to({ x: -783, y: 73, z: -1673 }, 1000)
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
        //@ts-ignore
        if (this.intersected && !isMobile()) {
          //@ts-ignore
          this.intersected.material.color.setHex(this.intersected.currentHex);
        }

        this.intersected = object as Mesh & { currentHex: number };

        if (!isMobile()) {
          //@ts-ignore
          const material = object.material as MeshBasicMaterial;
          //@ts-ignore
          this.intersected.currentHex = material.color.getHex();
          material.color.setHex(0x0045a6);
        }
      }
      return;
    }

    const parrentNode = this.getParentRecrcive(object) as Mesh;
    if (this.intersected !== parrentNode) {
      if (!isMobile() && this.intersected) {
        //@ts-ignore
        this.intersected.material.color.setHex(this.intersected.currentHex);
      }

      this.intersected = parrentNode.children[1] as Mesh & {
        currentHex: number;
      };
      this.intersected.name = parrentNode.name;

      if (!isMobile()) {
        this.oldMaterial = (this.intersected.material as Material).clone();
        this.intersected.material = new MeshBasicMaterial({ color: 0xffffff });
      }
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
        this.intersected.material = this.oldMaterial;
        this.intersected = undefined;
        // (logoHolder.scene.children[0] as Mesh).material = new MeshBasicMaterial({ color: 0xF0F0F0 });
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.intersect();
    TWEEN.update();
    this.composer.render();
  }

  render() {
    return (
      <canvas id="viewer-3d" style={{ background: "rgba(0, 0, 0, 0)" }} />
    );
  }
}
