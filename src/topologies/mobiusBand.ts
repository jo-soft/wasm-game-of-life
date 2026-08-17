import type { TopologyConfig } from './types';

export const MobiusBand: TopologyConfig = {
  glue: (row, col, rows, cols) => {
    const c = ((col % cols) + cols) % cols;
    const rowWrapped = row < 0 || row >= rows;
    const r = ((row % rows) + rows) % rows;
    return { row: r, col: rowWrapped ? cols - 1 - c : c };
  },
  parametrization: (u: number, v: number) => {
    const R = 1.0;
    const w = 0.8;

    const theta = u * 2 * Math.PI;
    const t = (v - 0.5) * w;

    const halfTwist = theta / 2;

    const x = (R + t * Math.cos(halfTwist)) * Math.cos(theta);
    const y = (R + t * Math.sin(halfTwist)) * Math.sin(theta);
    const z = t * Math.sin(halfTwist);

    return { x, y, z };
  },
};
