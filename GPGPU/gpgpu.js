"use strict";

var vs = `#version 300 es
precision highp float;

in vec3 position;
in highp vec2 uv;
out vec2 v_texcoord;

void main() {
  gl_Position = vec4(position, 1);
  v_texcoord = uv;
}
`;

var colorFS = `#version 300 es
precision highp float;

in vec2 v_texcoord;
out vec4 fragColor;

void main() {
    fragColor = vec4(v_texcoord, 0, 0);
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
const width = 1;
const height = 3672;
const texFbPair1 = createTextureAndFramebuffer(gl, width, height);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,  1, 0, 0, 1,
  -1, -1, 0, 0, 0,
   1,  1, 0, 1, 1,
   1, -1, 0, 1, 0
]), gl.STATIC_DRAW);
  
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const colorPrgPositionLoc = gl.getAttribLocation(colorProgram, "position");
gl.enableVertexAttribArray(colorPrgPositionLoc);
gl.vertexAttribPointer(colorPrgPositionLoc, 3, gl.FLOAT, false, 20, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const colorPrgUvLoc = gl.getAttribLocation(colorProgram, "uv");
gl.enableVertexAttribArray(colorPrgUvLoc);
gl.vertexAttribPointer(colorPrgUvLoc, 2, gl.FLOAT, false, 20, 12);

const indexBuffer = gl.createBuffer();
const triangleVertexIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleVertexIndices, gl.STATIC_DRAW);

// draw red rect to first texture through the framebuffer it's attached to
gl.useProgram(colorProgram);
gl.bindFramebuffer(gl.FRAMEBUFFER, texFbPair1.fb);
gl.viewport(0, 0, width, height);

gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);



const fb = texFbPair1.fb
gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
const packedRGBA = new Float32Array(width * height * 4);
gl.readPixels(
          0, 0, width, height, gl.RGBA, gl.FLOAT, packedRGBA);

const ys = packedRGBA.filter((e, i) => i%4===1);
console.log(ys.join('\n'));

// for (var i = 0; i < 10; i += 1) {
//   console.log(ys[i+1] + ":" + ys[i] + " Diff: " + 1/(ys[i+1] - ys[i]));
// }