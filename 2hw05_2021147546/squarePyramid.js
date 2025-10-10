// squarePyramid.js

export class SquarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;

        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const v0 = [0.5, 0.0, 0.5];    // (+x, 0, +z)
        const v1 = [-0.5, 0.0, 0.5];   // (-x, 0, +z)
        const v2 = [-0.5, 0.0, -0.5];  // (-x, 0, -z)
        const v3 = [0.5, 0.0, -0.5];   // (+x, 0, -z)
        const v_apex = [0.0, 1.0, 0.0];

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
        
        const normalize = (v) => {
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            return [v[0]/len, v[1]/len, v[2]/len];
        };
        const getNormal = (p1, p2, p3) => {
            const v_a = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]];
            const v_b = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]];
            const n_x = v_a[1]*v_b[2] - v_a[2]*v_b[1];
            const n_y = v_a[2]*v_b[0] - v_a[0]*v_b[2];
            const n_z = v_a[0]*v_b[1] - v_a[1]*v_b[0];
            return normalize([n_x, n_y, n_z]);
        };

        const n_front = getNormal(v1, v0, v_apex); // v1 -> v0 -> v_apex
        const n_right = getNormal(v0, v3, v_apex); // v0 -> v3 -> v_apex
        const n_back = getNormal(v3, v2, v_apex);  // v3 -> v2 -> v_apex
        const n_left = getNormal(v2, v1, v_apex);  // v2 -> v1 -> v_apex
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
        
        const c_front = [1, 0, 0, 1]; // Red
        const c_right = [1, 1, 0, 1]; // Yellow
        const c_back = [1, 0, 1, 1];  // Green
        const c_left = [0, 1, 1, 1];  // Cyan
        const c_bottom = [0, 0, 1, 1]; // Blue

        this.colors = new Float32Array(16 * 4); // 16 vertices * 4 components (RGBA)

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

        if (options.color) {
            for (let i = 0; i < 16 * 4; i += 4) {
                this.colors.set(options.color, i);
            }
        }

        this.texCoords = new Float32Array([
            // front face (v1, v0, v_apex) - (0,0), (1,0), (0.5, 1) 
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
        
        this.faceNormals = new Float32Array(this.normals.length);
        this.faceNormals.set(this.normals);
        this.vertexNormals = new Float32Array(this.normals.length); 

        this.vertexNormals.set(this.normals);
        
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

        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
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