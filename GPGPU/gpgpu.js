"use strict";

// Parameters
const numLoops = 512;
const width = 4096;
const height = 1;
const epoch = 100;

let mainCode = '';
for (let i = 0; i < numLoops; i++) {
  mainCode += 'uv.x = texture(x, uv).r;\n'
  // mainCode += 'uv.x += uv.y;\n'
}

var vs = `#version 300 es
precision highp float;
in vec3 clipSpacePos;
in vec2 uv;
out vec2 resultUV;

void main() {
  gl_Position = vec4(clipSpacePos, 1);
  resultUV = uv;
}
`;

var colorFS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 resultUV;
out vec4 outputColor;
const vec2 halfCR = vec2(0.5, 0.5);
uniform sampler2D x;

void setOutput(float val) {
    outputColor = vec4(val, 0, 0, 0);
}

void main() {
  vec2 uv = resultUV;
  float result = 1.0;
  ${mainCode}
  setOutput(uv.x);
}
`;

function createShader(gl, source, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  var program = gl.createProgram();
  var vshader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  var fshader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  gl.attachShader(program, vshader);
  gl.deleteShader(vshader);
  gl.attachShader(program, fshader);
  gl.deleteShader(fshader);
  gl.linkProgram(program);

  var log = gl.getProgramInfoLog(program);
  if (log) {
    console.log(log);
  }

  log = gl.getShaderInfoLog(vshader);
  if (log) {
    console.log(log);
  }

  log = gl.getShaderInfoLog(fshader);
  if (log) {
    console.log(log);
  }

  return program;
}

function createTextureAndFramebuffer(gl, width, height) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
     gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return {tex: tex, fb: fb};
}

const gl = document.createElement("canvas").getContext("webgl2");
gl.getExtension('EXT_color_buffer_float');
const colorProgram = createProgram(gl, vs, colorFS);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,  1, 0, 0, 1,
  -1, -1, 0, 0, 0,
   1,  1, 0, 1, 1,
   1, -1, 0, 1, 0
]), gl.STATIC_DRAW);
  
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const colorPrgPositionLoc = gl.getAttribLocation(colorProgram, "clipSpacePos");
const textureLocation = gl.getUniformLocation(colorProgram, "x");
gl.enableVertexAttribArray(colorPrgPositionLoc);
gl.vertexAttribPointer(colorPrgPositionLoc, 3, gl.FLOAT, false, 20, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const colorPrgUvLoc = gl.getAttribLocation(colorProgram, "uv");
gl.enableVertexAttribArray(colorPrgUvLoc);
gl.vertexAttribPointer(colorPrgUvLoc, 2, gl.FLOAT, false, 20, 12);

// Upload texture.
var texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
const data = [];
for (let number = 0; number < width * height; number++) {
  data.push(number / width / height, 0, 0, 0);
}
const dataForUpload = new Float32Array(data);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, dataForUpload);

const indexBuffer = gl.createBuffer();
const triangleVertexIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleVertexIndices, gl.STATIC_DRAW);

const texFbPair1 = createTextureAndFramebuffer(gl, width, height);
gl.bindFramebuffer(gl.FRAMEBUFFER, texFbPair1.fb);


function runProgram() {
  // draw red rect to first texture through the framebuffer it's attached to
  gl.useProgram(colorProgram);
  gl.viewport(0, 0, width, height);
  
  // Tell the shader to use texture unit 0 for u_texture
  gl.uniform1i(textureLocation, 0);
  
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  const fb = texFbPair1.fb
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  const packedRGBA = new Float32Array(width * height * 4);
  gl.readPixels(
            0, 0, width, height, gl.RGBA, gl.FLOAT, packedRGBA);
  return packedRGBA;
}
let result = runProgram();

var start = Date.now();
// you can set epoch = 1 and log = true to verify output values.
var log = false;
for (let i = 0; i < epoch; i++) {
  runProgram();
}
var end = Date.now();
console.log('program', (end - start) / epoch);

// Print the result.
const ys = result.filter((e, i) => i%4===0).slice(0, 5);
console.log(ys.join('\n'));