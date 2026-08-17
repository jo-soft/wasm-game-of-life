#version 300 es

in vec3 aPos;
in vec2 aUv;

uniform mat4 uMvp;
out vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = uMvp * vec4(aPos, 1.0);
}