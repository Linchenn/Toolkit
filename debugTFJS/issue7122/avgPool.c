#version 300 es
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    in vec2 resultUV;
    out vec4 outputColor;
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

    
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}

    
vec2 packedUVfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}

  

    float sampleTexture(sampler2D textureSampler, vec2 uv) {
      return texture(textureSampler, uv).r;
    }
  

    void setOutput(float val) {
      outputColor = vec4(val, 0, 0, 0);
    }
  
uniform sampler2D x;
uniform int offsetx;

    ivec5 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx * vec2(576,
                             3));

      int index = resTexRC.x * 3 + resTexRC.y;

      int r = index / 1728; index -= r * 1728;int c = index / 192; index -= c * 192;int d = index / 24; index -= d * 24;int d2 = index / 3; int d3 = index - d2 * 3;

      ivec5 outShape = ivec5(r, c, d, d2, d3);
      return outShape;
    }
  

      
      float getX(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(9, 3, 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(3.0, 27.0);
        return sampleTexture(x, uv);
      }
    
      float getX(int row, int col, int depth, int depth2, int depth3) {
        return getX(col, depth, depth2, depth3);
      }
    
    float getXAtOutCoords() {
      ivec5 coords = getOutputCoords();
      
      return getX(coords.x, coords.y, coords.z, coords.w, coords.u);
    }
  

      const ivec3 strides =
        ivec3(1, 1, 1);
      const ivec3 pads = ivec3(3, 3, 3);
      const float initializationValue = 0.0;
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xD, int xR, int xC, int ch) {
        if (xC < 0 || xC >= 3) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xD, xR, xC, ch);
      }

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xDCorner = xCorner.x;
        int xRCorner = xCorner.y;
        int xCCorner = xCorner.z;

        // max/min x(?, ?, ?, d) to get y(yD, yR, yC, ch).
        // ? = to be determined
        vec4 minMaxValue = vec4(0.0);
        float avgValue = 0.0;
        count = 0.0;

        for (int wD = 0; wD < 1;
            wD += 1) {
          int xD = xDCorner + wD;

          if (xD < 0 || xD >= 3) {
            continue;
          }

          for (int wR = 0; wR < 2;
            wR += 1) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= 3) {
              continue;
            }

            for (int wC = 0; wC < 0; wC += 4) {
              int xC = xCCorner + wC * 1;

              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + 1, ch),
                getValue(batch, xD, xR, xC + 2 * 1, ch),
                getValue(batch, xD, xR, xC + 3 * 1, ch)
              );

              
                if (true) {
                    avgValue += dot(values, ones);
                } else {
                    minMaxValue = max(values, minMaxValue);
                }
    
            }

            int xC = xCCorner + 0;
            if (false) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                initializationValue,
                initializationValue,
                initializationValue
              );

              
                if (true) {
                    avgValue += dot(values, ones);
                } else {
                    minMaxValue = max(values, minMaxValue);
                }
    
            } else if (true) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + 1, ch),
                initializationValue,
                initializationValue
              );

                        
                if (true) {
                    avgValue += dot(values, ones);
                } else {
                    minMaxValue = max(values, minMaxValue);
                }
    
            } else if (false) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + 1, ch),
                getValue(batch, xD, xR, xC + 2 * 1, ch),
                initializationValue
              );

              
      if (true) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = max(values, minMaxValue);
      }
    
            }
          }
          setOutput(avgValue / count);
        }
      }