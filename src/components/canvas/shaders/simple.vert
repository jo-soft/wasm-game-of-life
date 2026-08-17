attribute vec3 aPos;
  attribute vec2 aUv;
  uniform mat4 uMvp;
  varying vec2 vUv;
  void main() {
    vUv = aUv;
    gl_Position = uMvp * vec4(aPos, 1.0);
  }