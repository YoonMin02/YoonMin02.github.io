// main.js

/*-------------------------------------------------------------------------
Homework 05: Camera Pyrmaid Viewing

- Viewing a 3D square pyramid at origin with perspective projection
- The pyramid is stationary.
- A camera is rotating around the origin through the circle of radius 3
- The height (y position) of the camera is oscillating between 0 and 10.
- The camera is always looking at the origin.
---------------------------------------------------------------------------*/

// glMatrix 라이브러리의 함수들 (mat4, vec3 등)과 util 파일들을 불러옵니다.
// util 파일의 경로가 '../util/'에서 변경되었을 수 있으므로, 프로젝트 구조에 맞게 조정해야 합니다.
import { resizeAspectRatio, Axes } from '/util/util.js';
import { Shader, readShaderFile } from '/util/shader.js';
// Cube 대신 이전 단계에서 구현한 SquarePyramid를 불러옵니다.
import { SquarePyramid } from './squarePyramid.js'; 

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 

// --- 과제 요구사항에 맞춰 상수 설정 ---
// 4) Camera position의 x와 z는 radius = 3인 circular path를 돕니다.
const cameraRadiusXZ = 3.0; 
// 5) Camera의 circular movement (x and z)의 속도는 90 deg/sec 입니다.
const cameraSpeedXZ = 90.0; 
// 5) Camera의 y 방향 속도는 45 deg/sec 입니다.
const cameraSpeedY = 45.0;  

// Cube 대신 SquarePyramid 인스턴스 생성
const pyramid = new SquarePyramid(gl);
const axes = new Axes(gl, 1.8);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    // 1) canvas의 크기는 700x700 이어야 합니다.
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    // shVert.glsl과 shFrag.glsl 파일이 필요합니다.
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {

    const currentTime = Date.now();

    // deltaTime: elapsed time from the last frame
    const deltaTime = (currentTime - lastFrameTime) / 1000.0; // convert to second

    // elapsedTime: elapsed time from the start time
    const elapsedTime = (currentTime - startTime) / 1000.0; // convert to second

    lastFrameTime = currentTime;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // 6) 사각뿔은 제자리에 고정되어 있으며, rotation하지 않습니다.
    // 따라서 modelMatrix는 단위 행렬로 유지되거나, 최소한 rotation 코드는 제거되어야 합니다.
    // mat4.rotateX(modelMatrix, modelMatrix, glMatrix.toRadian(deltaTime * 50)); // 원본 코드 제거
    // 초기화 시 modelMatrix가 단위 행렬인 상태로 유지됩니다.

    // Viewing transformation matrix (카메라 위치 계산)
    // XZ 궤도 (circular path)
    const angleXZ = glMatrix.toRadian(cameraSpeedXZ * elapsedTime);
    let camX = cameraRadiusXZ * Math.sin(angleXZ);
    let camZ = cameraRadiusXZ * Math.cos(angleXZ);
    
    // Y 진동 (0부터 10까지 반복)
    // Math.sin()의 범위는 [-1, 1]입니다. 이를 [0, 10] 범위로 변환:
    // f(t) = A * sin(wt) + B
    // A (진폭) = (max - min) / 2 = (10 - 0) / 2 = 5.0
    // B (중앙값/수직 이동) = (max + min) / 2 = (10 + 0) / 2 = 5.0
    const angleY = glMatrix.toRadian(cameraSpeedY * elapsedTime);
    let camY = 5.0 * Math.sin(angleY) + 5.0; // range [0, 10]

    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ), // camera position
        vec3.fromValues(0, 0, 0), // look at origin
        vec3.fromValues(0, 1, 0)); // up vector

    // drawing the pyramid
    shader.use(); // using the pyramid's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader); // cube.draw(shader) 대신 pyramid.draw(shader) 사용

    // drawing the axes (using the axes's shader)
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        await initShader();

        // Projection transformation matrix
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // starting time (global variable) for animation
        startTime = lastFrameTime = Date.now();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}