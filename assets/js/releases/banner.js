import * as THREE from "../modules/three.module.min.js";
import { GLTFLoader } from "../modules/GLTFLoader.js";

const container = document.querySelector("#three-container");
const canvas = document.querySelector("#three-canvas");

let mouse = {x: 0.0, y: 0.0}
let scrollPercent = 0.0;
let camera;

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x151515 );
const renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas,});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;


const options = {
    rootMargin: "0px",
    scrollMargin: "0px",
    threshold: 0.0,
};

const observerCallback = function(entries, observer){
    entries.forEach((entry)=>{
        if(entry.target != container) return;
        if(entry.isIntersecting){
            play();
        }else{
            stop();
        }
    });
};

const observer = new IntersectionObserver(observerCallback, options);
observer.observe(container);

document.body.addEventListener("pointermove", function(e){
    mouse.x = e.clientX / container.clientWidth;
    mouse.y = e.clientY / container.clientHeight;
})

window.addEventListener("scroll", (event) => {
    scrollPercent = window.scrollY / container.clientHeight;
})

window.addEventListener("resize", (e) => {updateViewportSize()});

function updateViewportSize(){
    let w = container.clientWidth * window.devicePixelRatio,
        h = container.clientHeight * window.devicePixelRatio;
    camera.fov = 25.0;
    camera.aspect = w / h;
    renderer.setSize(w, h, false);
    camera.updateProjectionMatrix();
}

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 8.5);
directionalLight.position.set(-0.5, 1, 1);
directionalLight.target.position.set(0.0, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

const backLight = new THREE.DirectionalLight(0xb5e3ff, 4.0);
backLight.position.set(0.5, -0.5, -1);
backLight.target.position.set(0.0, 0, 0);
scene.add(backLight);
scene.add(backLight.target);


let mixer;
let clock = new THREE.Clock();

function animate() {        
    const dt = clock.getDelta();
    if ( mixer ) mixer.update( dt );
    if (camera){
        camera.position.x = (mouse.x - 0.5) * 0.5;
        camera.position.y = -(mouse.y - 0.5) * 0.25 -scrollPercent;
        renderer.render( scene, camera );
    }
}

function play(){
    renderer.setAnimationLoop(animate);
}

function stop(){
    renderer.setAnimationLoop(null);
}

const loader = new GLTFLoader();


loader.load(import.meta.resolve("./banner_test.glb"), function ( gltf ) {
    let GLBScene = gltf.scene;
    GLBScene.position.x = 2.0;
    
    GLBScene.traverse(function(child) {
        if(child.name == "Camera"){
            camera = child;
            updateViewportSize();
        }
    });

    mixer = new THREE.AnimationMixer( GLBScene );
    const clip = THREE.AnimationClip.findByName( gltf.animations, 'Scene' );
    const action = mixer.clipAction( clip );
    action.play();

    scene.add( GLBScene );

}, undefined, function ( error ) {
    console.error( error );
} );

play();