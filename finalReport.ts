import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";

class ThreeJSContainer {
    private scene: THREE.Scene;
    private cloud: THREE.Points;
    private particleNum = 2000;
    private tweenInfos: any[] = [];
    private shapeIndex = 0;

    private colors: string[] = ["#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#ffffff", "RAINBOW"];

    private shapeSequence: (() => THREE.Vector3[])[] = [
        this.generateSpherePoints,
        () => this.generateTextPoints("GOOD!"),
        this.generateCubePoints,
        () => this.generateTextPoints("YEAH!"),
        this.generatePyramidPoints,
        () => this.generateTextPoints("NICE!"),
    ];

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        let renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x0000));
        renderer.shadowMap.enabled = true;

        //カメラの設定
        let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        let orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        let render: FrameRequestCallback = (time) => {
            orbitControls.update();
            TWEEN.update();
            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        const positions = new Float32Array(this.particleNum * 3);
        const colors = new Float32Array(this.particleNum * 3);

        for (let i = 0; i < this.particleNum; i++) {
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;

            colors[i * 3 + 0] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
        });

        this.cloud = new THREE.Points(geometry, material);
        this.scene.add(this.cloud);

        for (let i = 0; i < this.particleNum; i++) {
            this.tweenInfos[i] = {
                x: 0,
                y: 0,
                z: 0,
                index: i,
            };
        }

        this.renderToNextShape();
    };

    private renderToNextShape = () => {
        const shapeFunc = this.shapeSequence[this.shapeIndex % this.shapeSequence.length];
        const targets = shapeFunc.call(this);

        const chosenColor = this.colors[Math.floor(Math.random() * this.colors.length)];

        if (chosenColor === "RAINBOW") {
            this.applyRainbowColors();
        } else {
            this.applySolidColor(new THREE.Color(chosenColor));
        }

        for (let i = targets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [targets[i], targets[j]] = [targets[j], targets[i]];
        }

        for (let i = 0; i < this.particleNum; i++) {
            const info = this.tweenInfos[i];
            const target = targets[i % targets.length];

            const tween = new TWEEN.Tween(info)
                .to({ x: target.x, y: target.y, z: target.z }, 2000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => this.updateParticlePosition(info))
                .onComplete(() => {
                    if (i === this.particleNum - 1) {
                        this.shapeIndex++;
                        setTimeout(this.renderToNextShape, 1500);
                    }
                });
            tween.start();
        }
    };

    private applyRainbowColors() {
        const colorAttr = (this.cloud.geometry as THREE.BufferGeometry).getAttribute("color") as THREE.BufferAttribute;
        for (let i = 0; i < this.particleNum; i++) {
            const hue = i / this.particleNum;
            const rgb = new THREE.Color().setHSL(hue, 1.0, 0.5);
            colorAttr.setXYZ(i, rgb.r, rgb.g, rgb.b);
        }
        colorAttr.needsUpdate = true;
    }

    private applySolidColor(color: THREE.Color) {
        const colorAttr = (this.cloud.geometry as THREE.BufferGeometry).getAttribute("color") as THREE.BufferAttribute;
        for (let i = 0; i < this.particleNum; i++) {
            colorAttr.setXYZ(i, color.r, color.g, color.b);
        }
        colorAttr.needsUpdate = true;
    }

    private updateParticlePosition(info: any) {
        const positions = (this.cloud.geometry as THREE.BufferGeometry).getAttribute("position");
        positions.setXYZ(info.index, info.x, info.y, info.z);
        positions.needsUpdate = true;
    }

    private generateSpherePoints(): THREE.Vector3[] {
        const points: THREE.Vector3[] = [];
        const radius = 5;
        for (let i = 0; i < this.particleNum; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    private generateCubePoints(): THREE.Vector3[] {
        const points: THREE.Vector3[] = [];
        const size = 8;
        for (let i = 0; i < this.particleNum; i++) {
            const x = (Math.random() - 0.5) * size;
            const y = (Math.random() - 0.5) * size;
            const z = (Math.random() - 0.5) * size;
            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    private generatePyramidPoints(): THREE.Vector3[] {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < this.particleNum; i++) {
            const h = Math.random();
            const baseX = (Math.random() - 0.5) * 6;
            const baseZ = (Math.random() - 0.5) * 6;
            const x = (1 - h) * baseX;
            const y = h * 6 - 3;
            const z = (1 - h) * baseZ;
            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    private generateTextPoints(text: string): THREE.Vector3[] {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, size / 2, size / 2 + 20);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        const points: THREE.Vector3[] = [];
        for (let y = 0; y < size; y += 2) {
            for (let x = 0; x < size; x += 2) {
                const index = (y * size + x) * 4;
                if (data[index + 3] > 128) {
                    const tx = (x - size / 2) / 20;
                    const ty = -(y - size / 2) / 20;
                    const tz = 0;
                    points.push(new THREE.Vector3(tx, ty, tz));
                }
            }
        }

        return points;
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    let container = new ThreeJSContainer();

    let viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 13));
    document.body.appendChild(viewport);
}
