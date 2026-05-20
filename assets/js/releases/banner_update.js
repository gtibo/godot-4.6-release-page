import * as THREE from "../modules/three.module.min.js";
import { GLTFLoader } from "../modules/GLTFLoader.js";

export class ReleaseBanner{
    constructor(container_id, canvas_id){
        this.container = document.querySelector(container_id);
        this.canvas = document.querySelector(canvas_id);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x151515 );

        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas});
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;

        this.timer = new THREE.Timer();
        this.timer.connect( document );

        this.sceneCamera = null;

        this.viewSize = {x: 0.0, y: 0.0};

        this.observer = new IntersectionObserver(this.IntersectionObserverCallback.bind(this), {
            rootMargin: "0px",
            scrollMargin: "0px",
            threshold: 0.0,
        });
        this.observer.observe(this.container);


        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 8.5);
        directionalLight.position.set(-0.5, 1, 1);
        directionalLight.target.position.set(0.0, 0, 0);
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);

        const backLight = new THREE.DirectionalLight(0xb5e3ff, 4.0);
        backLight.position.set(0.5, -0.5, -1);
        backLight.target.position.set(0.0, 0, 0);
        this.scene.add(backLight);
        this.scene.add(backLight.target);

        window.addEventListener("resize", (_e)=>{ this.checkForResize() });
    }

    checkForResize(){
        const pixelRatio = window.devicePixelRatio;
        let width  = Math.floor( this.container.clientWidth  * pixelRatio );
        let height = Math.floor( this.container.clientHeight * pixelRatio );

        const maxPixelCount= 3840*2160;
        const pixelCount = width * height;
        const renderScale = pixelCount > maxPixelCount ? Math.sqrt(maxPixelCount / pixelCount) : 1;

        this.viewSize.x = Math.floor(width * renderScale);
        this.viewSize.y = Math.floor(height * renderScale);

        const needResize = (
            this.canvas.width !== this.viewSize.x 
            || 
            this.canvas.height !== this.viewSize.y
        );

        if(needResize) this.resizeRenderer(this.viewSize.x, this.viewSize.y);
    }

    resizeRenderer(width, height){
        this.renderer.setSize( width, height, false);
        if (this.sceneCamera){
            this.sceneCamera.aspect = width / height;
            this.sceneCamera.updateProjectionMatrix();
        }
    }

    IntersectionObserverCallback(entries, observer){
        entries.forEach((entry)=>{
            if(entry.target != this.container) return;
            if(entry.isIntersecting){
                this.play();
            }else{
                this.stop();
            }
        });
    }

    play(){
        this.renderer.setAnimationLoop(this.update.bind(this));
    }

    stop(){
        this.renderer.setAnimationLoop(null);
    }

    update(timestamp){
        const delta = this.timer.getDelta();
        if ( this.sceneCamera ) this.renderer.render( this.scene, this.sceneCamera );
        if ( this.mixer ) this.mixer.update( delta );
    }

    async loadScene(GLBScenePath){
        const loader = new GLTFLoader();
        const glb = await loader.loadAsync(import.meta.resolve(GLBScenePath));
        glb.scene.traverse((child) => {
            if (child instanceof THREE.Camera) {
                this.sceneCamera = child;
            }
        });

        this.mixer = new THREE.AnimationMixer( glb.scene );
        const clip = THREE.AnimationClip.findByName( glb.animations, 'Scene' );
        const action = this.mixer.clipAction( clip );
        action.play();

        this.checkForResize();
        this.scene.add(glb.scene);
        this.container.classList.add("loaded");
    }
}