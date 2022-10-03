#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 resultUV;
out vec4 outputColor;
const vec2 halfCR = vec2(0.5, 0.5);

int imod(int x, int y) {
    return x - y * (x / y);
}
    
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}

float sampleTexture(sampler2D textureSampler, vec2 uv) {
    return texture(textureSampler, uv).r;
}


void setOutput(vec4 val) {
    outputColor = val;
}
  
uniform sampler2D matrixA;
uniform int offsetmatrixA;
uniform sampler2D matrixB;
uniform int offsetmatrixB;

    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(633, 632));
      int index = resTexRC.x * 632 + resTexRC.y;

      int b = index / 400000;
      index -= b * 400000;

      int r = 2 * (index / 20);
      int c = imod(index, 20) * 2;

      return ivec3(b, r, c);
    }
  

        
vec4 getMatrixA(int row, int col) {
    vec2 uv = packedUVfrom2D(16, 566, 566, row, col);
    return texture(matrixA, uv);
}

vec4 getMatrixB(int row, int col) {
    vec2 uv = (vec2(col, row) + halfCR) / vec2(40.0, 32.0);
    return texture(matrixB, uv);
}
    
// Don't use uniform for sharedDimensionPacked for performance.
const float sharedDimension = 16.0;

vec4 dot2x2ARowBCol(ivec3 rc) {
    vec4 result = vec4(0);
    for (int i = 0; i < 16; i++) {
        int batchA = rc.x;
        int batchB = rc.x;
        vec4 a = getMatrixA(rc.y, i * 2);
        vec4 b = getMatrixB(i * 2, rc.z);

        // These swizzled products need to be separately added.
        // See: https://github.com/tensorflow/tfjs/issues/1735
        result += (a.xxzz * b.xyxy);
        result += (a.yyww * b.zwzw);
    }
    return result;
}

void main() {
    ivec3 rc = getOutputCoords();
    vec4 result = dot2x2ARowBCol(rc);
    setOutput(result);
}