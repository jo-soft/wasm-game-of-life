#version 300 es
precision mediump float;

uniform sampler2D uTex;
in vec2 vUv;
out vec4 FragColor;

void main() {
  FragColor = texture(uTex, vUv);
}