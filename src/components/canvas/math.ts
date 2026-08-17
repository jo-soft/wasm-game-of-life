import type { MeshData } from './types';
import type { ParametrizationFunction } from '../../topologies';

export function buildParametricMesh(
  uSegments: number,
  vSegments: number,
  surface: (u: number, v: number) => [number, number, number]
): MeshData {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= vSegments; y++) {
    const v = y / vSegments;
    for (let x = 0; x <= uSegments; x++) {
      const u = x / uSegments;
      const [px, py, pz] = surface(u, v);
      positions.push(px, py, pz);
      uvs.push(u, 1 - v);
    }
  }

  for (let y = 0; y < vSegments; y++) {
    for (let x = 0; x < uSegments; x++) {
      const i0 = y * (uSegments + 1) + x;
      const i1 = i0 + 1;
      const i2 = i0 + (uSegments + 1);
      const i3 = i2 + 1;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

export function createMesh(
  parametrization: ParametrizationFunction,
  uSegments = 256,
  vSegments = 256
): MeshData {
  return buildParametricMesh(uSegments, vSegments, (u, v) => {
    const { x, y, z } = parametrization(u, v);
    return [x, y, z];
  });
}

export function identity4(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function multiply4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export function perspective(
  fovyRad: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1 / Math.tan(fovyRad / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

export function translate4(x: number, y: number, z: number): Float32Array {
  const m = identity4();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function rotateX(rad: number): Float32Array {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

export function rotateY(rad: number): Float32Array {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}
