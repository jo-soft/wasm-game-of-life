import type { TopologyConfig } from './types';

export const KleinBottle: TopologyConfig = {
  glue: (row: number, col: number, rows: number, cols: number) => {
    if (row === 0) return { row: rows - 1, col };
    if (row === rows - 1) return { row: 0, col };
    if (col === 0) return { row, col: cols - 1 };
    if (col === cols - 1) return { row, col: 0 };
    return null;
  },
  parametrization: (u: number, v: number) => {
    const theta = u * 2 * Math.PI;
    const phi = v * Math.PI;
    const x = (2 + Math.cos(theta / 2) * Math.sin(phi) - Math.sin(theta / 2) * Math.sin(2 * phi)) * Math.cos(theta);
    const y = (2 + Math.cos(theta / 2) * Math.sin(phi) - Math.sin(theta / 2) * Math.sin(2 * phi)) * Math.sin(theta);
    const z = Math.sin(theta / 2) * Math.sin(phi) + Math.cos(theta / 2) * Math.sin(2 * phi);
    return { x, y, z };
  },
};