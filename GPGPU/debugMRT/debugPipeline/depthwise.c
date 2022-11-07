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
  
uniform highp sampler2DArray x;
uniform int offsetx;
uniform sampler2D W;
uniform int offsetW;
uniform ivec2 pads;
uniform ivec2 strides;
uniform ivec2 dilations;
uniform ivec2 inDims;
out vec4 outputColor;

    void setOutput(vec4 val) {
      outputColor = val;
    }
  

    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(2, 4));
      int index = resTexRC.x * 4 + resTexRC.y;

      
      int b2 = index / 8;
      index -= b2 * 8;
    

      int b = index / 8;
      index -= b * 8;

      int r = 2 * (index / 4);
      int c = imod(index, 4) * 2;

      return ivec4(b2, b, r, c);
    }
  

    vec4 getX(int b2, int b, int row, int col) {
      int texelIndexInTex = b2 * 4 + b * 2 + (row / 4) * 2 + (col / 4);
      int x = texelIndexInTex / 2;
      int y = texelIndexInTex - x * 2;
      int z = (row & 2) + (col & 2) / 2;
      return texelFetch(x, ivec3(x, y, z), 0);
    }
  
    vec4 getXAtOutCoords() {
      ivec4 coords = getOutputCoords();
      
      vec4 outputValue = getX(coords.x, coords.y, coords.z, coords.w);
      return outputValue;
    }
  

    vec4 getW(int b2, int b, int row, int col) {
      int index = b2 * 8 + b * 4 + (row / 2) * 1 + (col / 2);
      int texR = index / 1;
      int texC = index - texR * 1;
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(1, 16);
      return texture(W, uv);
    }
  
    vec4 getWAtOutCoords() {
      ivec4 coords = getOutputCoords();
      coords.w = 0;
      vec4 outputValue = getW(coords.x, coords.y, coords.z, coords.w);
      return vec4(outputValue.xx, outputValue.zz);
    }
  

      

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / 1;
        int q = d2 - d1 * 1;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
        vec4 dotProd = vec4(0.000000000000001);

        
      int xR; int xC; int xCOffset;
      vec4 wTexel; vec4 previous; vec4 final;
          vec4 xTexelC0;
          int xTexelC0Ready;
          vec4 xTexelC1;
          int xTexelC1Ready;
          vec4 xC0;
          vec4 xTexelC2;
          int xTexelC2Ready;
          vec4 xTexelC3;
          int xTexelC3Ready;
          vec4 xC1;
    for (int r = 0; r < 2; r++) {
      
          xTexelC0 = vec4(0.0);
          xTexelC0Ready = 0;
          xTexelC1 = vec4(0.0);
          xTexelC1Ready = 0;
          xC0 = vec4(0.0);
          xTexelC2 = vec4(0.0);
          xTexelC2Ready = 0;
          xTexelC3 = vec4(0.0);
          xTexelC3Ready = 0;
          xC1 = vec4(0.0);
        xR = xRCorner + r * dilations[0];
        if (xR >=0 && xR < inDims[0]) {
      
          xC = xCCorner + 0;
          
                if (xC >= 0 && xC < inDims[1] && xTexelC0Ready == 0) {
                  xTexelC0 = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC0.zw = vec2(0.0);
                  }
                  xTexelC0Ready = 1;
                }

                xC0 = xTexelC0;
                
                  xCOffset = xC + imod(pads[1], 2) + 2;

                  if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC1Ready == 0) {
                    xTexelC1 = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      xTexelC1.zw = vec2(0.0);
                    }
                    xTexelC1Ready = 1;
                  }
                  
                    xC1 = vec4(xTexelC0.zw, xTexelC1.xy);
                    
            wTexel = getW(r, 0, d1, q);
            dotProd += xC0 * vec4(wTexel.xz, wTexel.xz);
          
              wTexel = getW(r, 1, d1, q);
              dotProd += xC1 * vec4(wTexel.xz, wTexel.xz);
            
          xC = xCCorner + 2;
          
    }
  
      }
    

        vec4 result = dotProd - vec4(0.000000000000001);
        
        
        setOutput(result);
      }
    