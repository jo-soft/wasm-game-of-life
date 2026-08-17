import type { TopologyConfig } from './types';

export const Torus: TopologyConfig = {
    glue: (row, col, rows, cols) => ({
        row: ((row % rows) + rows) % rows,
        col: ((col % cols) + cols) % cols,
    }),
    parametrization: (u: number, v: number) => {
        const R = 1   
        const r = 0.6;

        const theta = u * 2 * Math.PI; 
        const phi = v * 2 * Math.PI;   

        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = (R + r * Math.cos(phi)) * Math.sin(theta);
        const z = r * Math.sin(phi);

        return { x, y, z };
    },
};