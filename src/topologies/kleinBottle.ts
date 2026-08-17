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
    // R is the main radius (controls central hole size)
    // r controls tube thickness
    const R = 1; 
    const r = 0.4; 

    const uAngle = u * 2 * Math.PI;
    const vAngle = v * 2 * Math.PI;

    const tubeRadius = R + r * (Math.cos(uAngle / 2) * Math.sin(vAngle) - Math.sin(uAngle / 2) * Math.sin(2 * vAngle));

    const x = tubeRadius * Math.cos(uAngle);
    const y = tubeRadius * Math.sin(uAngle);
    const z = r * (Math.sin(uAngle / 2) * Math.sin(vAngle) + Math.cos(uAngle / 2) * Math.sin(2 * vAngle));

    return { x, y, z };
  },
};