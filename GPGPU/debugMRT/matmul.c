#version 300 es
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    in vec2 resultUV;
    const vec2 halfCR = vec2(0.5, 0.5);

    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    uniform float NAN;
    
    
    
      #define round(value) newRound(value)
      int newRound(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 newRound(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    int idiv(int a, int b, float sign) {
      int res = a / b;
      int mod = imod(a, b);
      if (sign < 0. && mod != 0) {
        res -= 1;
      }
      return res;
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

    
vec2 uvFromFlat(int texNumR, int texNumC, int index) {
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
  int texelIndex = index / 2;
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
ivec3 packedCoordsfrom1D(int texNumR, int texNumC, int index) {
  int texelIndex = index / 2;
  int texelIndexInTex = texelIndex / 2;
  int z = texelIndex & 1;
  int x = texelIndexInTex / texNumC;
  int y = texelIndexInTex - x * texNumC;
  return ivec3(x, y, z);
}

    
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}

ivec3 packedCoordsfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndexInTex = (row / 4) * texelsInLogicalRow + (col / 4);
  int x = texelIndexInTex / texNumC;
  int y = texelIndexInTex - x * texNumC;
  int z = (row & 2) + (col & 2) / 2;
  return ivec3(x, y, z);
}

    
vec2 packedUVfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}

ivec3 packedCoordsfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int texelIndexInTex = b * texelsInBatch + (row / 4) * texelsInLogicalRow + (col / 4);
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
  float getChannel(vec4 frag, int dim) {
    float modCoord = mod(float(dim), 2.);
    return modCoord == 0. ? frag.r : frag.g;
  }


    float sampleTexture(sampler2D textureSampler, vec2 uv) {
      return texture(textureSampler, uv).r;
    }
  
uniform sampler2D matrixA;
uniform int offsetmatrixA;
uniform sampler2D matrixB;
uniform int offsetmatrixB;
layout(location = 0) out highp vec4 result_00;
layout(location = 1) out highp vec4 result_01;
layout(location = 2) out highp vec4 result_10;
layout(location = 3) out highp vec4 result_11;


  ivec3 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx *
                           vec2(64, 4));
    int index = resTexRC.x * 4 + resTexRC.y;
    int b = 0;
    int r = index / 4;
    int c = index - r * 4;
    return ivec3(b, r * 4, c * 4);
  }


      
    vec4 getMatrixA(int row, int col) {
      vec2 uv = (vec2(col, row) + halfCR) / vec2(16.0, 256.0);

      return texture(matrixA, uv);
    }
  
      vec4 getMatrixA(int b, int row, int col) {
        return getMatrixA(row, col);
      }
    
    vec4 getMatrixAAtOutCoords() {
      ivec3 coords = getOutputCoords();
      
      vec4 outputValue = getMatrixA(coords.x, coords.y, coords.z);
      return outputValue;
    }
  

      
    vec4 getMatrixB(int row, int col) {
      vec2 uv = (vec2(col, row) + halfCR) / vec2(16.0, 16.0);

      return texture(matrixB, uv);
    }
  
      vec4 getMatrixB(int b, int row, int col) {
        return getMatrixB(row, col);
      }
    
    vec4 getMatrixBAtOutCoords() {
      ivec3 coords = getOutputCoords();
      
      vec4 outputValue = getMatrixB(coords.x, coords.y, coords.z);
      return outputValue;
    }
  

      
// Don't use uniform for sharedDimensionPacked for performance.
const float sharedDimension = 4.0;

void main() {
    ivec3 rc = getOutputCoords();
    int row = rc.y;
    int col = rc.z;

    vec4 res_00 = vec4(0);
    vec4 res_01 = vec4(0);
    vec4 res_10 = vec4(0);
    vec4 res_11 = vec4(0);

    for (int ic = 0; ic < 4; ++ic) {  // iC/4
        vec4 a_00 = getMatrixA(row, ic);
        vec4 a_01 = getMatrixA(row, ic + 2);
        vec4 a_10 = getMatrixA(row + 2, ic);
        vec4 a_11 = getMatrixA(row + 2, ic + 2);

        vec4 b_00 = getMatrixB(ic, col);
        vec4 b_01 = getMatrixB(ic, col + 2);
        vec4 b_10 = getMatrixB(ic + 2, col);
        vec4 b_11 = getMatrixB(ic + 2, col + 2);

        vec4 a_row_0 = vec4(a_00.xy, a_01.xy);
        vec4 a_row_1 = vec4(a_00.zw, a_01.zw);
        vec4 a_row_2 = vec4(a_10.xy, a_11.xy);
        vec4 a_row_3 = vec4(a_10.zw, a_11.zw);

        vec4 b_col_0 = vec4(b_00.xz, b_10.xz);
        vec4 b_col_1 = vec4(b_00.yw, b_10.yw);
        vec4 b_col_2 = vec4(b_01.xz, b_11.xz);
        vec4 b_col_3 = vec4(b_01.yw, b_11.yw);

        res_00.x += dot(a_row_0, b_col_0);
        res_00.y += dot(a_row_0, b_col_1);
        res_00.z += dot(a_row_1, b_col_0);
        res_00.w += dot(a_row_1, b_col_1);

        res_01.x += dot(a_row_0, b_col_2);
        res_01.y += dot(a_row_0, b_col_3);
        res_01.z += dot(a_row_1, b_col_2);
        res_01.w += dot(a_row_1, b_col_3);

        res_10.x += dot(a_row_2, b_col_0);
        res_10.y += dot(a_row_2, b_col_1);
        res_10.z += dot(a_row_3, b_col_0);
        res_10.w += dot(a_row_3, b_col_1);

        res_11.x += dot(a_row_2, b_col_2);
        res_11.y += dot(a_row_2, b_col_3);
        res_11.z += dot(a_row_3, b_col_2);
        res_11.w += dot(a_row_3, b_col_3);
    }
    result_00 = res_00;
    result_01 = res_01;
    result_10 = res_10;
    result_11 = res_11;
}