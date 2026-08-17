import type { TopologyConfig } from './types';

export const Sphere: TopologyConfig = {
  glue: (row: number, col: number, rows: number, cols: number) => {
    const wrappedCol = ((col % cols) + cols) % cols;
    if (row === 0) return { row: rows - 1, col: wrappedCol };
    if (row === rows - 1) return { row: 0, col: wrappedCol };
    return null;
  },
  parametrization: (u: number, v: number) => {
    const theta = u * 2 * Math.PI;
    const phi = v * Math.PI;
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);
    return { x, y, z };
  },
};
