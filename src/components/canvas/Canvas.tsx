import {
  CAMERA_FOV_RAD,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_DISTANCE_Z,
  ROTATION_SPEED_Y,
  ROTATION_TILT_X,
} from './constants';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { CanvasProps, WebGLRenderingContextExtended } from './types';
import { createMesh, perspective, translate4, multiply4, rotateX, rotateY } from './math';
import { VS_SOURCE, FS_SOURCE, createProgram } from './shaders';
import './Canvas.css';

declare global {
  interface HTMLCanvasElement {
    onpaint?: (() => void) | null;
    requestPaint?: () => void;
  }
}

export const Canvas: React.FC<CanvasProps> = ({
  grid,
  aliveColor = '#1a1a1a',
  deadColor = '#ecdede',
  topology,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const htmlGridRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number>(0);
  const dirtyTextureRef = useRef<boolean>(true);

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const htmlGrid = htmlGridRef.current;
    if (!canvas || !htmlGrid) return;

    // Chromium HTML-in-canvas feature flag currently keys off this attribute.
    canvas.setAttribute('layoutsubtree', '');
    htmlGrid.setAttribute('layoutsubtree', '');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const htmlGrid = htmlGridRef.current;
    if (!canvas || !htmlGrid || rows === 0 || cols === 0) return;

    const gl: WebGLRenderingContextExtended | null = canvas.getContext('webgl2', { antialias: true });
    if (!gl) return;

    // --- ResizeObserver Setup ---
    const observer = new ResizeObserver(([entry]) => {
      const dpc: readonly ResizeObserverSize[] = entry.devicePixelContentBoxSize;
      const newWidth: number = dpc
        ? dpc[0].inlineSize
        : Math.round(entry.contentRect.width * window.devicePixelRatio);
      const newHeight: number = dpc
        ? dpc[0].blockSize
        : Math.round(entry.contentRect.height * window.devicePixelRatio);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = Math.max(1, newWidth);
        canvas.height = Math.max(1, newHeight);
      }
    });

    const supportsDevicePixelContentBox =
      typeof ResizeObserverEntry !== 'undefined' &&
      'devicePixelContentBoxSize' in ResizeObserverEntry.prototype;

    const options: ResizeObserverOptions = supportsDevicePixelContentBox
      ? { box: 'device-pixel-content-box'}
      : {};

    observer.observe(canvas, options);

    const initialWidth = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
    const initialHeight = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
    if (canvas.width !== initialWidth || canvas.height !== initialHeight) {
      canvas.width = initialWidth;
      canvas.height = initialHeight;
    }

    // --- WebGL Setup ---
    const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
    const mesh = createMesh(topology.parametrization);

    const posBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const texture = gl.createTexture();

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aUv = gl.getAttribLocation(program, 'aUv');
    const uMvp = gl.getUniformLocation(program, 'uMvp');
    const uTex = gl.getUniformLocation(program, 'uTex');

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uTex, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.97, 0.97, 0.98, 1.0);

    const uploadHtmlTexture = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texElementImage2D!(gl.TEXTURE_2D, gl.RGBA8, htmlGrid);
    };

    const onPaint: EventListener  = () => {
      uploadHtmlTexture();
      dirtyTextureRef.current = false;
    };

    // Some builds surface only the paint event, not the onpaint property callback.
    canvas.addEventListener('paint', onPaint);
    canvas.requestPaint!();

    // --- Render Loop ---
    const render = (timeMs: number) => {
      if (dirtyTextureRef.current) {
        canvas.requestPaint!();
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = canvas.width / canvas.height;
      const proj = perspective(CAMERA_FOV_RAD, aspect, CAMERA_NEAR, CAMERA_FAR);
      const view = translate4(0, 0, CAMERA_DISTANCE_Z);
      const model = multiply4(
        rotateY(timeMs * ROTATION_SPEED_Y),
        rotateX(ROTATION_TILT_X)
      );
      const mvp = multiply4(proj, multiply4(view, model));

      if (uMvp) gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    // --- Cleanup ---
    return () => {
      observer.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      canvas.onpaint = null;
      canvas.removeEventListener('paint', onPaint);
      gl.deleteTexture(texture);
      gl.deleteBuffer(posBuffer);
      gl.deleteBuffer(uvBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
    };
  }, [topology, rows, cols]);

  useEffect(() => {
    dirtyTextureRef.current = true;
  }, [grid, aliveColor, deadColor]);

  return (
    <div className="canvas-shell">
      <canvas ref={canvasRef} className="canvas-surface">
        <div
          ref={htmlGridRef}
          className="canvas-html-grid"
          data-cols={cols}
          data-rows={rows}
          style={
            {
              '--cols': cols,
              '--rows': rows,
              '--alive': aliveColor,
              '--dead': deadColor,
            } as React.CSSProperties // typecaste needed because CSS variables are not part of the standard CSSProperties type
          }
        >
          {grid.map((row, r) =>
            row.map((alive, c) => (
              <div
                key={`${r}-${c}`}
                className={`canvas-cell ${alive ? 'is-alive' : 'is-dead'}`}
              />
            ))
          )}
        </div>
      </canvas>
    </div>
  );
};

export default Canvas;