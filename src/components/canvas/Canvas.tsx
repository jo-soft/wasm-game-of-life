import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CAMERA_FOV_RAD,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_DISTANCE_Z,
  ROTATION_SPEED_Y,
  ROTATION_TILT_X,
} from './constants';
import { CanvasProps, MeshData, WebGLRenderingContextExtended } from './types';
import { createMesh, perspective, translate4, multiply4, rotateX, rotateY } from './math';
import { useGl } from '../../hooks/useGl';
import { useGLSLProgram } from '../../hooks/useGLSLProgram/useGLSLProgram';
import VS_SOURCE from './shaders/simple.vert';
import FS_SOURCE from './shaders/simple.frag';
import './Canvas.css';

declare global {
  interface HTMLCanvasElement {
    onpaint?: (() => void) | null;
    requestPaint?: () => void;
  }
}

function createStaticBuffer(
  gl: WebGL2RenderingContext,
  target: number,
  data: AllowSharedBufferSource // ✅ Accepts Float32Array<ArrayBufferLike>
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
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

  const resourcesRef = useRef<{
    mesh: MeshData;
    vao: WebGLVertexArrayObject;
    posBuffer: WebGLBuffer;
    uvBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    texture: WebGLTexture;
    uMvp: WebGLUniformLocation | null;
  } | null>(null);

  const glOptions = useMemo<WebGLContextAttributes>(() => ({ antialias: true }), []);
  const gl = useGl<WebGLRenderingContextExtended>(canvasRef, glOptions);

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  // Experimental Chromium Layout Attribute Setup
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const htmlGrid = htmlGridRef.current;
    if (!canvas || !htmlGrid) return;

    canvas.setAttribute('layoutsubtree', '');
    htmlGrid.setAttribute('layoutsubtree', '');
  }, []);

  const [program, compileErr] = useGLSLProgram(gl, VS_SOURCE, FS_SOURCE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const dpc = entry.devicePixelContentBoxSize;
      const newWidth = dpc
        ? dpc[0].inlineSize
        : Math.round(entry.contentRect.width * window.devicePixelRatio);
      const newHeight = dpc
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

    observer.observe(
      canvas,
      supportsDevicePixelContentBox ? { box: 'device-pixel-content-box' } : {}
    );

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!gl || !program || rows === 0 || cols === 0) return;

    const mesh = createMesh(topology.parametrization);

    const vao = gl.createVertexArray();
    if (!vao) return;

    gl.bindVertexArray(vao);

    const posBuffer = createStaticBuffer(gl, gl.ARRAY_BUFFER, mesh.positions);
    const uvBuffer = createStaticBuffer(gl, gl.ARRAY_BUFFER, mesh.uvs);
    const indexBuffer = createStaticBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices);

    const texture = gl.createTexture();

    if (!posBuffer || !uvBuffer || !indexBuffer || !texture) {
      if (vao) gl.deleteVertexArray(vao);
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aUv = gl.getAttribLocation(program, 'aUv');
    const uTex = gl.getUniformLocation(program, 'uTex');
    const uMvp = gl.getUniformLocation(program, 'uMvp');

    if (aPos >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    }

    if (aUv >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.bindVertexArray(null);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (uTex) gl.uniform1i(uTex, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.97, 0.97, 0.98, 1.0);

    resourcesRef.current = {
      mesh,
      vao,
      posBuffer,
      uvBuffer,
      indexBuffer,
      texture,
      uMvp,
    };

    return () => {
      const resources = resourcesRef.current;
      if (!resources) return;

      gl.deleteVertexArray(resources.vao);
      gl.deleteTexture(resources.texture);
      gl.deleteBuffer(resources.posBuffer);
      gl.deleteBuffer(resources.uvBuffer);
      gl.deleteBuffer(resources.indexBuffer);
      resourcesRef.current = null;
    };
  }, [gl, program, topology, rows, cols]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const htmlGrid = htmlGridRef.current;
    const resources = resourcesRef.current;
    if (!canvas || !htmlGrid || !gl || !resources) return;

    const onPaint: EventListener = () => {
      gl.bindTexture(gl.TEXTURE_2D, resources.texture);
      gl.texElementImage2D!(gl.TEXTURE_2D, gl.RGBA8, htmlGrid);
      dirtyTextureRef.current = false;
    };

    canvas.addEventListener('paint', onPaint);
    canvas.requestPaint?.();

    return () => {
      canvas.removeEventListener('paint', onPaint);
    };
  }, [gl, program, rows, cols]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const resources = resourcesRef.current;
    if (!canvas || !gl || !program || !resources) return;

    const render = (timeMs: number) => {
      if (dirtyTextureRef.current) {
        canvas.requestPaint!();
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = canvas.width / canvas.height;
      const proj = perspective(CAMERA_FOV_RAD, aspect, CAMERA_NEAR, CAMERA_FAR);
      const view = translate4(0, 0, CAMERA_DISTANCE_Z);
      const model = multiply4(rotateY(timeMs * ROTATION_SPEED_Y), rotateX(ROTATION_TILT_X));
      const mvp = multiply4(proj, multiply4(view, model));

      gl.useProgram(program);
      if (resources.uMvp) gl.uniformMatrix4fv(resources.uMvp, false, mvp);

      // Bind VAO and Draw
      gl.bindVertexArray(resources.vao);
      gl.drawElements(gl.TRIANGLES, resources.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [gl, program, topology, rows, cols]);

  // 6. Mark Texture as Dirty on State Change
  useEffect(() => {
    dirtyTextureRef.current = true;
  }, [grid, aliveColor, deadColor]);

  return (
    <div className="canvas-shell">
      {compileErr && <p>{compileErr}</p>}
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
            } as React.CSSProperties
          }
        >
          {grid.map((row, r) =>
            row.map((alive, c) => (
              <div key={`${r}-${c}`} className={`canvas-cell ${alive ? 'is-alive' : 'is-dead'}`} />
            ))
          )}
        </div>
      </canvas>
    </div>
  );
};

export default Canvas;
