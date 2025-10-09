import { resizeAspectRatio } from '/util/util.js';
import { Shader, readShaderFile } from '/util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vaoBase, vaoBlade, vaoSmallBlade;
let rotationAngle = 0;
let startTime = 0; 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    // Base (red square)
    const baseVertices = new Float32Array([
        -0.10,  0.50,  // Top-left
        -0.10, -0.50,  // Bottom-left
         0.10, -0.50,  // Bottom-right
         0.10,  0.50   // Top-right
    ]);

    const baseIndices = new Uint16Array([
        0, 1, 2,    // First triangle
        0, 2, 3     // Second triangle
    ]);

    const baseColors = new Float32Array([
        0.6, 0.3, 0.0, 1.0,  // brown
        0.6, 0.3, 0.0, 1.0,
        0.6, 0.3, 0.0, 1.0,
        0.6, 0.3, 0.0, 1.0
    ]);

    vaoBase = gl.createVertexArray();
    gl.bindVertexArray(vaoBase);

    // VBO for base position
    const basePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, basePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, baseVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for base color
    const baseColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, baseColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, baseColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO for base
    const baseIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, baseIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, baseIndices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    // Blade (horizontal rectangle)
    const bladeVertices = new Float32Array([
        -0.30,  0.06,  // Top-left
        -0.30, -0.06,  // Bottom-left
         0.30, -0.06,  // Bottom-right
         0.30,  0.06   // Top-right
    ]);

    const bladeIndices = new Uint16Array([
        0, 1, 2,    // First triangle
        0, 2, 3     // Second triangle
    ]);

    const bladeColors = new Float32Array([
        1.0, 1.0, 1.0, 1.0,  // white
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ]);

    vaoBlade = gl.createVertexArray();
    gl.bindVertexArray(vaoBlade);

    // VBO for blade position
    const bladePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bladeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for blade color
    const bladeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, bladeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO for blade
    const bladeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bladeIndices, gl.STATIC_DRAW);

    const smallBladeVertices = new Float32Array([
        -0.08,  0.02,  // Top-left
        -0.08, -0.02,  // Bottom-left
         0.08, -0.02,  // Bottom-right
         0.08,  0.02   // Top-right
    ]);

    const smallBladeIndices = new Uint16Array([
        0, 1, 2,    // First triangle
        0, 2, 3     // Second triangle
    ]);

    const smallBladeColors = new Float32Array([
        0.5, 0.5, 0.5, 1.0,  // grey
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0
    ]);

    vaoSmallBlade = gl.createVertexArray();
    gl.bindVertexArray(vaoSmallBlade);

    // VBO for small blade position
    const smallBladePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, smallBladePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, smallBladeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for small blade color
    const smallBladeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, smallBladeColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, smallBladeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO for small blade
    const smallBladeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, smallBladeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, smallBladeIndices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw base (red square)
    shader.use();
    const baseTransform = mat4.create();
    shader.setMat4("u_transform", baseTransform);
    gl.bindVertexArray(vaoBase);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Calculate elapsed time
    const elapsedTime = (performance.now() - startTime) / 1000; // Convert to seconds

    // Main blade rotation
    const bladeTransform = mat4.create();
    mat4.translate(bladeTransform, bladeTransform, [0, 0.50, 0]); // Move to top of red square
    mat4.rotateZ(bladeTransform, bladeTransform, Math.sin(elapsedTime) * Math.PI * 2.0); // Rotate
    shader.setMat4("u_transform", bladeTransform);
    gl.bindVertexArray(vaoBlade);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Small blade rotation (sin(elapsedTime) × π × -10.0)
    const smallBladeRotation = Math.sin(elapsedTime) * Math.PI * -10.0;

    // Draw small blade at the left end of the main blade
    const smallBladeLeftTransform = mat4.create();
    mat4.translate(smallBladeLeftTransform, bladeTransform, [-0.30, 0, 0]); // Move to left end of main blade
    mat4.rotateZ(smallBladeLeftTransform, smallBladeLeftTransform, smallBladeRotation); // Rotate
    shader.setMat4("u_transform", smallBladeLeftTransform);
    gl.bindVertexArray(vaoSmallBlade);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // Draw small blade at the right end of the main blade
    const smallBladeRightTransform = mat4.create();
    mat4.translate(smallBladeRightTransform, bladeTransform, [0.30, 0, 0]); // Move to right end of main blade
    mat4.rotateZ(smallBladeRightTransform, smallBladeRightTransform, smallBladeRotation); // Rotate
    shader.setMat4("u_transform", smallBladeRightTransform);
    gl.bindVertexArray(vaoSmallBlade);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}



function animate(currentTime) {

    // Calculate elapsed time since the start of the animation
    const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds

    // Update rotation angle based on sin(elapsedTime) × π × 2.0
    rotationAngle = Math.sin(elapsedTime) * Math.PI * 2.0;

    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        await initShader();

        setupBuffers();

        startTime = performance.now();

        requestAnimationFrame(animate);
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}