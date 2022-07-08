import * as THREE from 'three';
// import * as dat from 'dat.gui';

interface Item {
    floatingSpeed: number;
    rotationSpeed: number;
    progress: number;
    material: THREE.MeshBasicMaterial | undefined;
    scale: number;
    angle: number;
    mesh: THREE.Mesh | undefined;
}

function getDefaultItem(): Item {
    const item: Item = {
        floatingSpeed: 0.0,
        rotationSpeed: 0.0,
        progress: 0.0,
        material: undefined,
        scale: 0.0,
        angle: 0.0,
        mesh: undefined
    };

    return item;
}

// const gui = new dat.GUI();
// const positionFolder = gui.addFolder('Flame');

export default class Flame {
    private items!: Item[];

    private group!: THREE.Group;

    private time: THREE.Clock;

    constructor() {
        this.time = new THREE.Clock();
        this.time.start();
        this.group = new THREE.Group();
        this.setMesh();
    }

    private setMesh(): void {
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        this.items = [];
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./model/gada/textures/smoke.png');

        for (let i = 0; i < 100; i += 1) {
            const item = getDefaultItem();

            item.floatingSpeed = Math.random() * 0.5;
            item.rotationSpeed = (Math.random() - 0.5) * Math.random() * 0.0002 + 0.0002;
            item.progress = Math.random();
            item.material = new THREE.MeshBasicMaterial({
                depthWrite: false,
                transparent: true,
                blending: THREE.AdditiveBlending,
                alphaMap: texture,
                side: THREE.DoubleSide,
                opacity: 0.7
            });
            item.angle = Math.random() * Math.PI * 2;
            item.mesh = new THREE.Mesh(geometry, item.material);

            item.material.color = new THREE.Color('Blue');

            item.mesh.position.z = (i + 1) * 0.005;

            this.group.add(item.mesh);

            // Save
            this.items.push(item);
        }
        this.group.scale.set(220, 200, 1);
        this.group.position.set(118, 339, 145);
        this.group.rotateX(Math.PI / 2);

        // positionFolder.add(this.group.position, 'x', 0, 800);
        // positionFolder.add(this.group.position, 'y', 0, 800);
        // positionFolder.add(this.group.position, 'z', 0, 800);

        // positionFolder.add(this.group.rotation, 'x', 0, Math.PI);
        // positionFolder.add(this.group.rotation, 'y', 0, Math.PI);
        // positionFolder.add(this.group.rotation, 'z', 0, Math.PI);

        // positionFolder.open();
    }

    public getFlames(): THREE.Group {
        return this.group;
    }

    public update(): void {

        const elapsedTime = this.time.getElapsedTime() * 1500;
        this.items.forEach((item) => {
            item.progress += this.time.getDelta() * 0.001;

            if (item.progress > 1) { item.progress = 0; }

            // Opacity
            if (item.material !== undefined) {
                item.material.opacity = Math.min((1 - item.progress) * 2, item.progress * 4);
                item.material.opacity = Math.min(item.material.opacity, 1);
                //item.material.opacity *= 0.25;
            }

            if (item.mesh !== undefined) {
                item.mesh.rotation.z = elapsedTime * item.rotationSpeed * 20;
                // const radius = 1 - item.progress * item.floatingSpeed;
                // item.mesh.position.x = Math.sin(item.angle) * radius;
                // item.mesh.position.y = Math.cos(item.angle) * radius;
            }
        });
    }
}