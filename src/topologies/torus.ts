import type { TopologyConfig } from './types';

export const Torus: TopologyConfig = {
    glue: (row, col, rows, cols) => ({
        row: ((row % rows) + rows) % rows,
        col: ((col % cols) + cols) % cols,
    }),
    parametrization: (u: number, v: number) => {
        const theta = u * 2 * Math.PI;
        const phi = v * 2 * Math.PI;
        const x = Math.cos(theta) * (1 + Math.cos(phi));
        const y = Math.sin(theta) * (1 + Math.cos(phi));
        const z = Math.sin(phi);
        return { x, y, z };
    },
};  