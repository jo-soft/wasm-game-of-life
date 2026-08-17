import type { TopologyConfig } from '../../topologies';

export interface MeshData {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
}

export interface WebGLRenderingContextExtended extends WebGL2RenderingContext {
  // Current HTML-in-canvas WebGL signature from the WICG explainer.
  texElementImage2D?: (
    target: number,
    internalformat: number,
    element: Element,
    config?: {
      sx?: number;
      sy?: number;
      swidth?: number;
      sheight?: number;
      width?: number;
      height?: number;
    }
  ) => void;
}

export interface CanvasProps {
  grid: boolean[][];
  topology: TopologyConfig;
  aliveColor?: string;
  deadColor?: string;
}
