// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set max size: 500이하 window크기
maxsize = 500;


// Initialize WebGL settings: viewport and clear color

render();



// Render loop
function render() {
    const smaller = Math.min(window.innerWidth, window.innerHeight);
    const size = Math.min(smaller, maxsize);
    canvas.width = size;
    canvas.height = size; 
    gl.enable(gl.SCISSOR_TEST);

    
    gl.viewport(0, 0, size/2, size/2);
    gl.scissor(0, 0, size/2, size/2);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    
    gl.viewport(size/2, 0, size/2, size/2);
    gl.scissor(size/2, 0, size/2, size/2);
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    
    gl.viewport(0, size/2, size/2, size/2);
    gl.scissor(0, size/2, size/2, size/2);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    
    gl.viewport(size/2, size/2, size/2, size/2);
    gl.scissor(size/2, size/2, size/2, size/2);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    
    
}

// Resize viewport when window size changes
window.addEventListener('resize', render);

