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
  int y = texelIndexInTex / texNumC;
  int x = texelIndexInTex - y * texNumC;
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
uniform sampler2D B;
uniform int offsetB;
out vec4 outputColor;

    void setOutput(vec4 val) {
      outputColor = val;
    }
  

    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(4, 4));
      int index = resTexRC.x * 4 + resTexRC.y;

      
      int b2 = index / 16;
      index -= b2 * 16;
    

      int b = index / 8;
      index -= b * 8;

      int r = 2 * (index / 4);
      int c = imod(index, 4) * 2;

      return ivec4(b2, b, r, c);
    }
  

    vec4 getA(int b2, int b, int row, int col) {
      int texelIndexInTex = b2 * 4 + b * 2 + (row / 4) * 2 + (col / 4);
      int x = texelIndexInTex / 2;
      int y = texelIndexInTex - x * 2;
      int z = (row & 2) + (col & 2) / 2;
      return texelFetch(A, ivec3(x, y, z), 0);
    }
  
    vec4 getAAtOutCoords() {
      ivec4 coords = getOutputCoords();
      
      vec4 outputValue = getA(coords.x, coords.y, coords.z, coords.w);
      return outputValue;
    }
  

    vec4 getB(int b2, int b, int row, int col) {
      int index = b2 * 16 + b * 8 + (row / 2) * 4 + (col / 2);
      int texR = index / 4;
      int texC = index - texR * 4;
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(4, 4);
      return texture(B, uv);
    }
  
    vec4 getBAtOutCoords() {
      ivec4 coords = getOutputCoords();
      
      vec4 outputValue = getB(coords.x, coords.y, coords.z, coords.w);
      return outputValue;
    }
  

      vec4 binaryOperation(vec4 a, vec4 b) {
        return a + b;
      }

      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();

        vec4 result = binaryOperation(a, b);
        

        setOutput(result);
      }