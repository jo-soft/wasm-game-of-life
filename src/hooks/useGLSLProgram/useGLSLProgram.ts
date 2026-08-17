import { useEffect, useMemo } from 'react';
import {
  UseShaderHookResult,
  UseShaderHookResultError,
  UseShaderHookResultSuccess,
  CompileShaderResult,
  CompileShaderSuccess,
  CompileShaderError,
} from './useGLSLProgram.types';

function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): CompileShaderResult {
  const shader = gl.createShader(type);
  if (!shader) {
    return [null, 'Failed to create shader'] satisfies CompileShaderError;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    return [null, log] satisfies CompileShaderError;
  }

  return [shader, null] satisfies CompileShaderSuccess;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): UseShaderHookResult {
  const vsRes = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  if (vsRes[1] !== null) {
    return [null, vsRes[1]] satisfies UseShaderHookResultError;
  }

  const fsRes = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (fsRes[1] !== null) {
    gl.deleteShader(vsRes[0]);
    return [null, fsRes[1]] satisfies UseShaderHookResultError;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vsRes[0]);
    gl.deleteShader(fsRes[0]);
    return [null, 'Failed to create program'] satisfies UseShaderHookResultError;
  }

  gl.attachShader(program, vsRes[0]);
  gl.attachShader(program, fsRes[0]);
  gl.linkProgram(program);

  gl.deleteShader(vsRes[0]);
  gl.deleteShader(fsRes[0]);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
    gl.deleteProgram(program);
    return [null, log] satisfies UseShaderHookResultError;
  }

  return [program, null] satisfies UseShaderHookResultSuccess;
}

export function useGLSLProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): UseShaderHookResult {
  const [program, err] = useMemo(() => {
    if (!gl) {
      return [null, null] satisfies UseShaderHookResultError;
    }

    return createProgram(gl, vsSource, fsSource);
  }, [gl, vsSource, fsSource]);

  useEffect(() => {
    return () => {
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [gl, program]);

  return [program, err];
}
