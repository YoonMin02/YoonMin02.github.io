/*-------------------------------------------------------------------------
07_LineSegments.js

left mouse button을 click하면 선분을 그리기 시작하고, 
button up을 하지 않은 상태로 마우스를 움직이면 임시 선분을 그리고, 
button up을 하면 최종 선분을 저장하고 임시 선분을 삭제함.

임시 선분의 color는 회색이고, 최종 선분의 color는 빨간색임.

이 과정을 반복하여 여러 개의 선분 (line segment)을 그릴 수 있음. 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치

let line = null;
let circle = null;
let intersectionPoints = [];

let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        
        if (!isDrawing) {
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            if (!circle) {
                startPoint = [glX, glY];
                isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
                tempEndPoint =[glX, glY];
            } else if (!line) {
                startPoint = [glX, glY];
                isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
                tempEndPoint =[glX, glY];
                intersectionPoints = [];
            }
            
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { 
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; 

            if (!circle) {
                const dx = tempEndPoint[0] - startPoint[0];
                const dy = tempEndPoint[1] - startPoint[1];
                const radius = Math.sqrt(dx * dx + dy * dy);
            }
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // lines.push([...startPoint, ...tempEndPoint])
            //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
            // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
            //     lines = [[1, 2, 3, 4]] 이 됨
            // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
            //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨

            if (!circle) {
                const dx = tempEndPoint[0] - startPoint[0];
                const dy = tempEndPoint[1] - startPoint[1];
                const radius = Math.sqrt(dx * dx + dy * dy);
                circle = [...startPoint, radius];

                updateText(textOverlay, "Circle: center (" + circle[0].toFixed(2) + ", " + circle[1].toFixed(2) +  
                                    ") radius = " + circle[2].toFixed(2));
            } else if (!line) {
                line = [...startPoint, ...tempEndPoint]; // line = [x1, y1, x2, y2]
                intersectionPoints = calcintersections(circle, line);
                updateText(textOverlay2, "Line segment: (" + line[0].toFixed(2) + ", " + line[1].toFixed(2) + 
                    ") ~ (" + line[2].toFixed(2) + ", " + line[3].toFixed(2) + ")");
                let text = "Intersection Points: " + intersectionPoints.length + " ";
                if (intersectionPoints.length > 0) {
                    for (let i = 0; i < intersectionPoints.length; i++) {
                        const p = intersectionPoints[i];
                        text += "Point " + (i + 1) + ": (" + p[0].toFixed(2) + ", " + p[1].toFixed(2) + ") ";
                    }
                    updateText(textOverlay3, text);

                } else {
                    updateText(textOverlay3, "No intersection");
                }
            }

            

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.use();
    
    // 1. 원 그리기 (Circle)
    if (circle) {
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
        drawCircle(gl, shader, circle[0], circle[1], circle[2], vao, positionBuffer);
    }
    
    // 2. 최종 선분 그리기 (Line Segment)
    if (line) {
        shader.setVec4("u_color", [0.7, 0.7, 0.7, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 3. 임시 선분 또는 임시 원 그리기 (Temporary Line/Circle)
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); 
        
        if (!circle) {
            const dx = tempEndPoint[0] - startPoint[0];
            const dy = tempEndPoint[1] - startPoint[1];
            const radius = Math.sqrt(dx * dx + dy * dy);
            drawCircle(gl, shader, startPoint[0], startPoint[1], radius, vao, positionBuffer);
            
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                          gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }
    
    if (intersectionPoints.length > 0) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        
        const pointsArray = intersectionPoints.flat(); 
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsArray), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, intersectionPoints.length);
    }

    axes.draw(mat4.create(), mat4.create()); 
}


function calcintersections(circle, line) {
    const [cx, cy, r] = circle;
    const [x1, y1, x2, y2] = line;
    const points = [];

    const p1x = x1 - cx;
    const p1y = y1 - cy;
    const p2x = x2 - cx;
    const p2y = y2 - cy;

    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const dr2 = dx * dx + dy * dy; 

    const D = p1x * p2y - p2x * p1y;

    const discriminant = r * r * dr2 - D * D;

    if (discriminant < 0) {
        return [];
    }
    
    const sqrtDisc = Math.sqrt(discriminant);

    const t1 = (D * dy + (dx > 0 ? 1 : -1) * dx * sqrtDisc) / dr2;
    const t2 = (D * dy - (dx > 0 ? 1 : -1) * dx * sqrtDisc) / dr2;
    const u1 = (-D * dx + Math.abs(dy) * sqrtDisc) / dr2;
    const u2 = (-D * dx - Math.abs(dy) * sqrtDisc) / dr2;
    
    const intersect1 = [
        (D * dy + (dy < 0 ? -1 : 1) * dx * sqrtDisc) / dr2,
        (-D * dx + Math.abs(dy) * sqrtDisc) / dr2
    ];
    const intersect2 = [
        (D * dy - (dy < 0 ? -1 : 1) * dx * sqrtDisc) / dr2,
        (-D * dx - Math.abs(dy) * sqrtDisc) / dr2
    ];
    

    const A = dr2;
    const B = 2 * (p1x * dx + p1y * dy);
    const C = p1x * p1x + p1y * p1y - r * r;

    const B_sq_4AC = B * B - 4 * A * C;
    
    if (B_sq_4AC < 0) {
        return []; 
    }
    
    const sqrt_B_sq_4AC = Math.sqrt(B_sq_4AC);

    const t_base = 2 * A;
    const t1_solution = (-B + sqrt_B_sq_4AC) / t_base;
    const t2_solution = (-B - sqrt_B_sq_4AC) / t_base;
    

    const EPSILON = 1e-6;

    const checkAndAdd = (t) => {
        if (t >= 0 - EPSILON && t <= 1 + EPSILON) {
            const ix = p1x + t * dx + cx;
            const iy = p1y + t * dy + cy;
            points.push([ix, iy]);
        }
    };
    
    checkAndAdd(t1_solution);
    if (Math.abs(t1_solution - t2_solution) > EPSILON) {
        checkAndAdd(t2_solution);
    }
    
    return points;
}

function drawCircle(gl, shader, cx, cy, radius, vao, positionBuffer) {
    const segments = 100; 
    const vertices = [];
    

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        const x = cx + radius * Math.cos(theta);
        const y = cy + radius * Math.sin(theta);
        
        vertices.push(x, y);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINE_LOOP, 0, segments); 
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
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3); 
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
