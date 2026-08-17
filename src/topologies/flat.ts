import { TopologyConfig } from './types';

export const Flat: TopologyConfig = {
  glue: (row, col, rows, cols) => ({
    row: ((row % rows) + rows) % rows,
    col: ((col % cols) + cols) % cols,
  }),
  parametrization: (u: number, v: number) => {
    const x = u;
    const y = v;
    const z = 0;
    return { x, y, z };
  },
};
