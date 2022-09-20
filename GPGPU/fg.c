#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 resultUV;
out vec4 outputColor;
const vec2 halfCR = vec2(0.5, 0.5);
uniform sampler2D x;

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


ivec4 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx *
    vec2(144, 256));
    int index = resTexRC.x * 256 + resTexRC.y;
    int r = index / 36864; index -= r * 36864;int c = index / 3072; index -= c * 3072;int d = index / 256; int d2 = index - d * 256;
    return ivec4(r, c, d, d2);
}
    
float getX(int row, int col, int depth) {
    float texR = dot(vec2(row, col), vec2(12, 1));
    float texC = float(depth);
    vec2 uv = (vec2(texC, texR) + halfCR) / vec2(256.0, 144.0);
    return sampleTexture(x, uv);
}

float getX(int row, int col, int depth, int depth2) {
    return getX(col, depth, depth2);
}

void main() {
    ivec4 coords = getOutputCoords();
    int batch = coords[0];
    int xRCorner = coords[1];
    int xCCorner = coords[2];
    float result = 0.0;

    int flatIndexStart = (xRCorner * 12 + xCCorner) * 256;
    for (int ch = 0; ch < 256; ch += 1) {
        int index = flatIndexStart + ch;
        int texR = index / 256;
        int texC = index - texR * 256;
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(256, 144);
        result += uv.x + uv.y;
    }
    setOutput(result);
}