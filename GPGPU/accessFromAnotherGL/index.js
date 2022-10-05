var canvas1;
var texture1;
var image;
var shaderProgram;
var vertex_buffer;
var texture_buffer;
var aVertLocation;
var aTexLocation;
var vertices = [];
var texCoords = [];

var gl;
var gl2;
var canvas2;
var texture2;
var shaderProgram2;
var vertex_buffer2;
var texture_buffer2;
var index_Buffer2;
var aVertLocation2;
var aTexLocation2;
var vertices2 = [];
var texCoords2 = [];

indices = [0, 1, 2, 0, 2, 3];
vertices = [-1, -1, 1, -1, 1, 1, -1, 1];
texCoords = [0, 0, 1, 0, 1, 1, 0, 1];

function initApp()
{
  initWebGL();
  
  image = new Image();
  image.onload = function(){
    render();
    render2();
  }
  image.crossOrigin = '';
  image.src = 'https://i.imgur.com/ZKMnXce.png';
}

function initWebGL()
{

  canvas1 = document.getElementById('glCanvas1');
  gl = canvas1.getContext('webgl2');

  /*====================== Shaders =======================*/

  // Vertex shader source code
  var vertCode = `
    attribute vec2 coordinates;
    attribute vec2 aTexCoord;
    varying highp vec2 vTexCoord;
    void main(void) {
      gl_Position = vec4(coordinates,1.0,1.0);
      vTexCoord = aTexCoord;
    }
  `;
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  //fragment shader source code
  var fragCode = `
    precision mediump float;
    uniform sampler2D texture;
    varying highp vec2 vTexCoord;
    void main(void) {
       gl_FragColor = texture2D(texture, vTexCoord);
    }
  `;
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.deleteShader( vertShader );
  gl.deleteShader( fragShader );
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  aVertLocation = gl.getAttribLocation(shaderProgram, "coordinates");
  aTexLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");

  vertex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.enableVertexAttribArray(aVertLocation);
  gl.vertexAttribPointer(aVertLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  texture_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texture_buffer);
  gl.enableVertexAttribArray(aTexLocation);
  gl.vertexAttribPointer(aTexLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  index_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.uniform1i( gl.getUniformLocation( shaderProgram, 'texture' ), 0 );
  gl.bindTexture(gl.TEXTURE_2D, null);


  //==========================================================//

  canvas2 = document.getElementById('glCanvas2');
  gl2 = canvas2.getContext('webgl2');
  var vertShader2 = gl2.createShader(gl2.VERTEX_SHADER);
  var fragShader2 = gl2.createShader(gl2.FRAGMENT_SHADER);
  gl2.shaderSource(vertShader2, vertCode);
  gl2.shaderSource(fragShader2, fragCode);
  gl2.compileShader(vertShader2);
  gl2.compileShader(fragShader2);

  shaderProgram2 = gl2.createProgram();
  gl2.attachShader(shaderProgram2, vertShader2);
  gl2.attachShader(shaderProgram2, fragShader2);
  gl2.deleteShader( vertShader2 );
  gl2.deleteShader( fragShader2 );
  gl2.linkProgram(shaderProgram2);
  gl2.useProgram(shaderProgram2);

  aVertLocation2 = gl2.getAttribLocation(shaderProgram2, "coordinates");
  aTexLocation2 = gl2.getAttribLocation(shaderProgram2, "aTexCoord");

  vertex_buffer2 = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, vertex_buffer2);
  gl2.enableVertexAttribArray(aVertLocation2);
  gl2.vertexAttribPointer(aVertLocation2, 2, gl2.FLOAT, false, 0, 0);
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);
  gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

  texture_buffer2 = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, texture_buffer2);
  gl2.enableVertexAttribArray(aTexLocation2);
  gl2.vertexAttribPointer(aTexLocation, 2, gl2.FLOAT, false, 0, 0);
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(texCoords), gl2.STATIC_DRAW);
  gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

  index_buffer2 = gl2.createBuffer();
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
  gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl2.STATIC_DRAW);
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, null);

  texture2 = gl2.createTexture();
  gl2.bindTexture(gl2.TEXTURE_2D, texture2);
  gl2.uniform1i( gl2.getUniformLocation( shaderProgram2, 'texture' ), 0 );
  gl2.bindTexture(gl2.TEXTURE_2D, null);	
}

function updateTexture()
{
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
} 	

function render()
{
  if ( !shaderProgram ) return;
  updateTexture();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.enableVertexAttribArray(aVertLocation);
  gl.enableVertexAttribArray(aTexLocation);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer)
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.disableVertexAttribArray(aVertLocation);
  gl.disableVertexAttribArray(aTexLocation);

}

function updateTexture2()
{
  gl2.bindTexture(gl2.TEXTURE_2D, texture2);
  gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, canvas1);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
  gl2.generateMipmap(gl2.TEXTURE_2D);		
  gl2.bindTexture(gl2.TEXTURE_2D, null);
} 	

function render2()
{
  if ( !shaderProgram2 ) return;
  updateTexture2();
  gl2.clearColor(0.0, 0.0, 0.0, 1.0);
  gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT );
  gl2.bindTexture(gl2.TEXTURE_2D, texture2);
  gl2.enableVertexAttribArray(aVertLocation2);
  gl2.enableVertexAttribArray(aTexLocation2);
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
  gl2.drawElements(gl2.TRIANGLES, 6, gl2.UNSIGNED_SHORT,0);
  gl2.disableVertexAttribArray(aVertLocation2);
  gl2.disableVertexAttribArray(aTexLocation2);
}

document.addEventListener('DOMContentLoaded', initApp);


function tfjsPlay() {
  const backend = new tf.MathBackendWebGL(canvas2)
  tf.registerBackend('cl', () => backend);
  tf.setBackend('cl');
  const a = tf.tensor({texture:texture1, width:12, height:12, channels:"R"});
}