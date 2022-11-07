#version 300 es
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
    ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
    int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

    vec4 result = vec4(0.);

    for (int i=0; i<4; i++) {
      int flatIndex = index + i;
      ivec3 rc = outCoordsFromFlatIndex(flatIndex);
      result[i] = getChannel(getA(rc.x, rc.y, rc.z), vec2(rc.y, rc.z));
    }

    outputColor = result;
  }