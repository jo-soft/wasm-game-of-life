import { useEffect, useState } from 'react';

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

import { useState, useEffect } from 'react';

export function useShaderProgram(
  gl: WebGLRenderingContext | null,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const [program, setProgram] = useState<WebGLProgram | null>(null);

  useEffect(() => {
    if (!gl) {
      return;
    }

    let nextProgram: WebGLProgram | null = null;

    try {
      nextProgram = createProgram(gl, vsSource, fsSource);
      setProgram(nextProgram);
    } catch (error) {
      console.error('[canvas] shader program creation failed:', error);
      setProgram(null);
    }

    return () => {
      if (nextProgram) {
        gl.deleteProgram(nextProgram);
      }
      setProgram(null);
    };
  }, [gl, vsSource, fsSource]);

  return gl ? program : null;
}