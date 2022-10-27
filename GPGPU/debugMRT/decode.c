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