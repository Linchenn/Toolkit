"use strict";

const width = 256;
const height = 144;
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
out vec4 outputColor;
const vec2 halfCR = vec2(0.5, 0.5);
uniform sampler2D x;

void setOutput(float val) {
    outputColor = vec4(val, 0, 0, 0);
}

//Based on the work of Dave Hoskins
//https://www.shadertoy.com/view/4djSRW
#define HASHSCALE1 443.8975
float random(float seed){
    vec2 p = resultUV * seed;
    vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

ivec4 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx * vec2(${height}, ${width}));
    int index = resTexRC.x * ${width} + resTexRC.y;
    int r = index / ${width * height}; index -= r * ${width * height};int c = index / ${12 * width}; index -= c * ${12 * width};int d = index / ${width}; int d2 = index - d * ${width};
    return ivec4(r, c, d, d2);
}

void main() {
    ivec4 coords = getOutputCoords();
    int batch = coords[0];
    int xRCorner = coords[1];
    int xCCorner = coords[2];
    float result = 0.0;

    int flatIndexStart = (xRCorner * 12 + xCCorner) * ${width};
    for (int ch = 0; ch < ${width}; ch += 1) {
      int index = flatIndexStart + ch;
      
      int texR = index / ${width};
      int texC = index - texR * ${width};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${width}, ${height});
      result += uv.x + uv.y;
      // result += texture(x, uv).r;

      // result += random(float(index)) + random(float(ch));

      // vec2 uv = vec2(random(float(index)), random(float(ch)));
      // result += texture(x, uv).r;
    }
    setOutput(result);
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
  data.push(number, 0, 0, 0);
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
let t = 0;

var start = Date.now();
for (let i = 0; i < epoch; i++) {
  result = runProgram();
  t += result[0];
}
var end = Date.now();
console.log('program', (end - start) / epoch);

result = runProgram();

// Print the result.
const ys = result.filter((e, i) => i%4===0).slice(0, 5);
console.log(ys.join('\n'));
console.log('t: ', t);