// squarePyramid.js

export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;

        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // 사각뿔의 정점 정의
        // 밑면 중심 (0, 0, 0), 밑면은 xz 평면 (y=0), dx=dz=1, 높이=1
        // 밑면 4개의 정점 (y=0)
        const v0 = [0.5, 0.0, 0.5];    // (+x, 0, +z)
        const v1 = [-0.5, 0.0, 0.5];   // (-x, 0, +z)
        const v2 = [-0.5, 0.0, -0.5];  // (-x, 0, -z)
        const v3 = [0.5, 0.0, -0.5];   // (+x, 0, -z)
        // 윗 꼭짓점 (y=1)
        const v_apex = [0.0, 1.0, 0.0];

        // 각 면마다 정점, 법선, 색상, 텍스처 좌표를 정의합니다 (flat shading을 위해).
        // 총 4개의 옆면(삼각형) + 1개의 밑면(사각형 2개의 삼각형) = 6개의 삼각형
        // 총 정점 수: 옆면 4개 * 3 정점/면 + 밑면 4개 정점 (2개의 삼각형) = 16개 (밑면은 큐브와 유사하게 4정점/면으로 처리)
        // 옆면: 4면 * 3정점/면 = 12 정점
        // 밑면: 1면 * 4정점/면 = 4 정점 
        // 총 16개의 정점
        
        // 정점 위치 (3 floats per vertex, total 16 vertices)
        this.vertices = new Float32Array([
            // front face (v1, v0, v_apex)
            v1[0], v1[1], v1[2],   v0[0], v0[1], v0[2],   v_apex[0], v_apex[1], v_apex[2],
            // right face (v0, v3, v_apex)
            v0[0], v0[1], v0[2],   v3[0], v3[1], v3[2],   v_apex[0], v_apex[1], v_apex[2],
            // back face (v3, v2, v_apex)
            v3[0], v3[1], v3[2],   v2[0], v2[1], v2[2],   v_apex[0], v_apex[1], v_apex[2],
            // left face (v2, v1, v_apex)
            v2[0], v2[1], v2[2],   v1[0], v1[1], v1[2],   v_apex[0], v_apex[1], v_apex[2],
            // bottom face (v2, v3, v0, v1) - 4 vertices for two triangles
            v2[0], v2[1], v2[2],   v3[0], v3[1], v3[2],   v0[0], v0[1], v0[2],   v1[0], v1[1], v1[2],
        ]);
        
        // 법선 벡터 (3 floats per vertex, total 16 vertices)
        // 각 면의 법선 벡터는 (정규화된) 면의 법선으로 설정하여 flat shading 구현
        const normalize = (v) => {
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            return [v[0]/len, v[1]/len, v[2]/len];
        };
        // 각 면의 법선 계산 (벡터 외적 이용)
        const getNormal = (p1, p2, p3) => {
            const v_a = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]];
            const v_b = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]];
            // N = V_a x V_b
            const n_x = v_a[1]*v_b[2] - v_a[2]*v_b[1];
            const n_y = v_a[2]*v_b[0] - v_a[0]*v_b[2];
            const n_z = v_a[0]*v_b[1] - v_a[1]*v_b[0];
            return normalize([n_x, n_y, n_z]);
        };

        // 옆면 법선 (시계 반대 방향 순서로 정점 정의)
        const n_front = getNormal(v1, v0, v_apex); // v1 -> v0 -> v_apex
        const n_right = getNormal(v0, v3, v_apex); // v0 -> v3 -> v_apex
        const n_back = getNormal(v3, v2, v_apex);  // v3 -> v2 -> v_apex
        const n_left = getNormal(v2, v1, v_apex);  // v2 -> v1 -> v_apex
        // 밑면 법선 (y=0, 아랫 방향: (0, -1, 0))
        const n_bottom = [0, -1, 0]; 

        this.normals = new Float32Array([
            // front face
            ...n_front, ...n_front, ...n_front,
            // right face
            ...n_right, ...n_right, ...n_right,
            // back face
            ...n_back, ...n_back, ...n_back,
            // left face
            ...n_left, ...n_left, ...n_left,
            // bottom face
            ...n_bottom, ...n_bottom, ...n_bottom, ...n_bottom,
        ]);
        
        // 색상 (4 floats per vertex, total 16 vertices)
        // 큐브처럼 면마다 다른 색상을 지정합니다.
        const c_front = [1, 0, 0, 1]; // Red
        const c_right = [1, 1, 0, 1]; // Yellow
        const c_back = [1, 0, 1, 1];  // Green
        const c_left = [0, 1, 1, 1];  // Cyan
        const c_bottom = [0, 0, 1, 1]; // Blue

        this.colors = new Float32Array(16 * 4); // 16 vertices * 4 components (RGBA)

        // 옆면 색상
        const setFaceColor = (startIndex, count, color) => {
            for (let i = 0; i < count; i++) {
                this.colors.set(color, (startIndex + i) * 4);
            }
        };

        setFaceColor(0, 3, c_front);
        setFaceColor(3, 3, c_right);
        setFaceColor(6, 3, c_back);
        setFaceColor(9, 3, c_left);
        setFaceColor(12, 4, c_bottom);

        // 옵션에 색상이 주어진 경우 전체 색상 통일
        if (options.color) {
            for (let i = 0; i < 16 * 4; i += 4) {
                this.colors.set(options.color, i);
            }
        }

        // 텍스처 좌표 (2 floats per vertex, total 16 vertices)
        this.texCoords = new Float32Array([
            // front face (v1, v0, v_apex) - (0,0), (1,0), (0.5, 1) 가정
            0, 0, 1, 0, 0.5, 1,
            // right face (v0, v3, v_apex)
            0, 0, 1, 0, 0.5, 1,
            // back face (v3, v2, v_apex)
            0, 0, 1, 0, 0.5, 1,
            // left face (v2, v1, v_apex)
            0, 0, 1, 0, 0.5, 1,
            // bottom face (v2, v3, v0, v1) - v0(1,1), v1(0,1), v2(0,0), v3(1,0)
            0, 0, 1, 0, 1, 1, 0, 1,
        ]);

        // 인덱스 (총 4개의 옆면 삼각형 + 2개의 밑면 삼각형 = 6개의 삼각형, 6 * 3 = 18 인덱스)
        this.indices = new Uint16Array([
            // front face (0, 1, 2)
            0, 1, 2,
            // right face (3, 4, 5)
            3, 4, 5,
            // back face (6, 7, 8)
            6, 7, 8,
            // left face (9, 10, 11)
            9, 10, 11,
            // bottom face (12, 13, 14), (14, 15, 12)
            12, 13, 14, 14, 15, 12, // v2, v3, v0, v0, v1, v2
        ]);
        
        // Cube 클래스의 smooth shading 관련 데이터는 사각뿔의 flat shading에는 불필요하므로 생략하거나,
        // 필요하다면 Cube의 구조를 따라 유사하게 정의할 수 있지만, 여기서는 최소한으로 생략합니다.
        this.faceNormals = new Float32Array(this.normals.length);
        this.faceNormals.set(this.normals);
        this.vertexNormals = new Float32Array(this.normals.length); // Smooth shading 미구현

        // smooth shading을 원하지 않으므로, vertexNormals를 faceNormals와 동일하게 설정
        this.vertexNormals.set(this.normals);
        
        // Cube 클래스에서 정의된 initBuffers 함수를 호출하여 버퍼를 초기화
        this.initBuffers();
    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
        this.updateNormals();
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
        this.updateNormals();
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // normals 데이터만 업데이트
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        // 총 인덱스 수: 4 (옆면) * 3 + 6 (밑면) = 18
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}