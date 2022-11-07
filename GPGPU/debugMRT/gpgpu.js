"use strict";

const width = 16;
const height = 256;
const epoch = 100;

const vs = `#version 300 es
precision highp float;
in vec3 clipSpacePos;
in vec2 uv;
out vec2 resultUV;

void main() {
  gl_Position = vec4(clipSpacePos, 1);
  resultUV = uv;
}
`;

const colorFS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 resultUV;

uniform sampler2D x;
layout(location = 0) out highp vec4 result_00;
layout(location = 1) out highp vec4 result_01;
layout(location = 2) out highp vec4 result_10;
layout(location = 3) out highp vec4 result_11;

void main() {
  result_00 = vec4(0, 1, 2, 3);
  result_01 = vec4(10, 11, 12, 13);
  result_10 = vec4(20, 21, 22, 23);
  result_11 = vec4(30, 31, 32, 33);
}
`;

const colorFS2 = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 resultUV;


int imod(int x, int y) {
  return x - y * (x / y);
}

ivec3 packedCoordsfrom2D(int texelsInLogicalRow, int texNumR,
int texNumC, int row, int col) {
int texelIndexInTex = (row / 4) * texelsInLogicalRow + (col / 4);
int x = texelIndexInTex / texNumC;
int y = texelIndexInTex - x * texNumC;
int z = (row & 2) + (col & 2) / 2;
return ivec3(x, y, z);
}

float getChannel(vec4 frag, vec2 innerDims) {
vec2 modCoord = mod(innerDims, 2.);
return modCoord.x == 0. ?
  (modCoord.y == 0. ? frag.r : frag.g) :
  (modCoord.y == 0. ? frag.b : frag.a);
}

float sampleTexture(sampler2D textureSampler, vec2 uv) {
  return texture(textureSampler, uv).r;
}

uniform highp sampler2DArray A;
uniform int offsetA;
uniform ivec2 texShape;
out vec4 outputColor;

void setOutput(vec4 val) {
  outputColor = val;
}


ivec3 getOutputCoords() {
ivec2 resTexRC = ivec2(resultUV.yx *
                        vec2(32, 32));
int index = resTexRC.x * 32 + resTexRC.y;

int b = index / 1024;
index -= b * 1024;

int r = 2 * (index / 8);
int c = imod(index, 8) * 2;

return ivec3(b, r, c);
}


  
vec4 getA(int row, int col) {
ivec3 coords = packedCoordsfrom2D(4, 64, 4, row, col);
return texelFetch(A, coords, 0);
}

vec4 getA(int b, int row, int col) {
return getA(row, col);
}


ivec3 outCoordsFromFlatIndex(int index) {
int r = index / 4096; index -= r * 4096;int c = index / 16; int d = index - c * 16;
return ivec3(r, c, d);
}

void main() {
ivec2 resTexRC = ivec2(resultUV.yx * vec2(32, 32));
int index = 4 * (resTexRC.x * 32 + resTexRC.y);

vec4 result = vec4(0.);

for (int i=0; i<4; i++) {
  int flatIndex = index + i;
  ivec3 rc = outCoordsFromFlatIndex(flatIndex);
  result[i] = getChannel(getA(rc.x, rc.y, rc.z), vec2(rc.y, rc.z));
  // result[i] = float(flatIndex);
}

outputColor = result;
// outputColor = texelFetch(A, ivec3(0,0,0), 0);
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

const gl = document.createElement("canvas").getContext("webgl2");
gl.getExtension('EXT_color_buffer_float');
const colorProgram = createProgram(gl, vs, colorFS);

// Vertex Buffer
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
const colorPrgUvLoc = gl.getAttribLocation(colorProgram, "uv");
gl.enableVertexAttribArray(colorPrgPositionLoc);
gl.vertexAttribPointer(colorPrgPositionLoc, 3, gl.FLOAT, false, 20, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.enableVertexAttribArray(colorPrgUvLoc);
gl.vertexAttribPointer(colorPrgUvLoc, 2, gl.FLOAT, false, 20, 12);

// Index Buffer
const indexBuffer = gl.createBuffer();
const triangleVertexIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleVertexIndices, gl.STATIC_DRAW);

/* Texture */
// Input texture
// Upload texture.
const textureLocation = gl.getUniformLocation(colorProgram, "x");
var texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
const data = [];
for (let number = 0; number < width * height; number++) {
  data.push(number, 0, 0, 0);
}
const dataForUpload = new Float32Array(data);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, dataForUpload);


// Output texture
const output = gl.createTexture();
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D_ARRAY, output);
// gl.bindTexture(gl.TEXTURE_2D, output);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA32F, width / 2, height / 2, 4);
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
// gl.framebufferTexture2D(
//    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);

gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, output, 0, 0);
gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, output, 0, 1);
gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, output, 0, 2);
gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, output, 0, 3);

gl.drawBuffers([
  gl.COLOR_ATTACHMENT0,
  gl.COLOR_ATTACHMENT1,
  gl.COLOR_ATTACHMENT2,
  gl.COLOR_ATTACHMENT3
]);

/* Texture End */

function runProgram() {
  // draw red rect to first texture through the framebuffer it's attached to
  gl.useProgram(colorProgram);
  gl.viewport(0, 0, width / 2, height / 2);
  
  // Tell the shader to use texture unit 0 for u_texture
  gl.uniform1i(textureLocation, 0);
  
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  const packedRGBA = new Float32Array(width * height * 4 / 4);
  gl.readBuffer(gl.COLOR_ATTACHMENT0 + 1);
  gl.readPixels(
            0, 0, width / 2, height / 2, gl.RGBA, gl.FLOAT, packedRGBA);
  return packedRGBA;
}

const result = runProgram();

// Print the result.
const ys = result.slice(0, 10);
console.log(ys.join('\n'));



const colorProgram2 = createProgram(gl, vs, colorFS2);
const textureLocation2 = gl.getUniformLocation(colorProgram2, "A");

// var texture2 = gl.createTexture();
// gl.activeTexture(gl.TEXTURE2);
// gl.bindTexture(gl.TEXTURE_2D, texture2);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, dataForUpload);

var texture2 = gl.createTexture();
gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture2);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texImage3D(
    gl.TEXTURE_2D_ARRAY,
    0,
    gl.RGBA32F,
    width / 4,
    height / 4,
    4,
    0,
    gl.RGBA,
    gl.FLOAT,
    new Float32Array(Array.from(Array(width * height).keys())) 
    // ().fill(16)
);


const output2 = gl.createTexture();
gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D, output2);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 32, 32, 0, gl.RGBA, gl.FLOAT, null);
const fb2 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output2, 0);

gl.drawBuffers([
  gl.COLOR_ATTACHMENT0
]);

function runProgram2() {
  // draw red rect to first texture through the framebuffer it's attached to
  gl.useProgram(colorProgram2);
  gl.viewport(0, 0, 32, 32);
  
  // Tell the shader to use texture unit 0 for u_texture
  gl.uniform1i(textureLocation2, 2);
  
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb2)
  const packedRGBA = new Float32Array(width * height);
  gl.readPixels(
            0, 0, 32, 32, gl.RGBA, gl.FLOAT, packedRGBA);
  return packedRGBA;
}

console.log(runProgram2());
// console.log(runProgram().slice(0, 10).join('\n'));

