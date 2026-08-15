import type { TopologyConfig } from './types';

export const MobiusBand: TopologyConfig = {
    glue: (row, col, rows, cols) => {
        const c = ((col % cols) + cols) % cols;
        const rowWrapped = row < 0 || row >= rows;
        const r = ((row % rows) + rows) % rows;
        return { row: r, col: rowWrapped ? cols - 1 - c : c };
    },
    parametrization: (u: number, v: number) => {
        const theta = u * Math.PI;
        const phi = v * 2 * Math.PI;
        const x = Math.cos(theta) * (1 + 0.5 * Math.cos(phi));
        const y = Math.sin(theta) * (1 + 0.5 * Math.cos(phi));
        const z = 0.5 * Math.sin(phi);
        return { x, y, z };
    },
};