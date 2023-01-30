
const webcamVideoEl = document.getElementById("webcamVideo");
const displayCanvasEl = document.getElementById("display");
const gl = displayCanvasEl.getContext("webgl");

const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, document.getElementById("vertex-shader").innerText);
gl.compileShader(vs);

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, document.getElementById("fragment-shader").innerText);
gl.compileShader(fs);
if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fs));
}

const prog = gl.createProgram();
gl.attachShader(prog, vs);
gl.attachShader(prog, fs);
gl.linkProgram(prog);
gl.useProgram(prog);

const vb = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vb);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,  -1,-1,  1,-1,  1,1 ]), gl.STATIC_DRAW);

const coordLoc = gl.getAttribLocation(prog, 'c');
gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coordLoc);

gl.activeTexture(gl.TEXTURE0);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

const texLoc = gl.getUniformLocation(prog, "tex");
const texSizeLoc = gl.getUniformLocation(prog, "texSize");



let customCanvas, customBackend;
function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: { 
        facingMode: "user",
        width: { ideal: 320 },
        height: { ideal: 240 } } }).then(async stream => {

        // customCanvas = document.createElement('canvas');
        // customBackend = new tf.MathBackendWebGL(customCanvas);
        // tf.registerBackend('custom-webgl', () => customBackend);
        // await tf.setBackend('custom-webgl');
        await tf.setBackend('webgl');
        // gl = customBackend.gpgpu.gl;

        displayCanvasEl.style.display = "block";
        webcamVideoEl.srcObject = stream;
        webcamVideoEl.play();
        webcamVideoEl.requestVideoFrameCallback(processFrame);
    }).catch(error => {
        console.error(error);
    });
}

function drawTexture(texture, metadata) {
    gl.viewport(0, 0, metadata.width, metadata.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture);
    gl.uniform1i(texLoc, 0);
    gl.uniform2f(texSizeLoc, metadata.width, metadata.height);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

}

function processFrame(now, metadata) {
    displayCanvasEl.width = metadata.width;
    displayCanvasEl.height = metadata.height;

    const input = tf.browser.fromPixels(webcamVideoEl);
    drawTexture(tf.backend().getDataInfo(input.dataId).texture.texture, metadata);
    // webcamVideoEl.requestVideoFrameCallback(processFrame);
}

startWebcam();