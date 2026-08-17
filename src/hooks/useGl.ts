import { RefObject, useEffect, useState } from 'react';

export function useGl<T extends WebGL2RenderingContext | null>(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options?: WebGLContextAttributes
): T | null {
  const [gl, setGl] = useState<T | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context: T | null = canvas.getContext('webgl2', options) as T;
    setGl(context);

    return () => {
      setGl(null);
    };
  }, [canvasRef, options]);

  return gl;
}
