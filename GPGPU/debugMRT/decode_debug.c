 `ivec3 outCoordsFromFlatIndex(int index) {
    int r = index / 4096; index -= r * 4096;int c = index / 16; int d = index - c * 16;
    return ivec3(r, c, d);
  }

  void main() {
    ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
    int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

    vec4 result = vec4(0.);

    for (int i=0; i<1; i++) {
      int flatIndex = index + i;
      ivec3 rc = outCoordsFromFlatIndex(flatIndex);
      result = getA(rc.x, rc.y, rc.z);
      // vec4(packedCoordsfrom2D(4, 64, 4, rc.y, rc.z), 0);
    }

    outputColor = texelFetch(A, ivec3(0,0, 3), 0);
  }`