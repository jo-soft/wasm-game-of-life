export type GlueFunction = (
  row: number,
  col: number,
  rows: number,
  cols: number
) => { row: number; col: number } | null;

export type ParametrizationFunction = (u: number, v: number) => { x: number; y: number; z: number };

export interface TopologyConfig {
  glue: GlueFunction;
  parametrization: ParametrizationFunction;
}
