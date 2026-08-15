# Canvas Module

This folder contains the rendering pipeline for the WebGL + HTML-in-canvas view.

## What each file does

- `Canvas.tsx`
  Main React component. Sets up WebGL, requests HTML-in-canvas paint updates, uploads the DOM grid into a texture, and renders the rotating surface.

- `Canvas.css`
  Styling for the canvas root, canvas element, and DOM grid used as texture source.

- `constants.ts`
  Camera and animation tuning constants (FOV, clipping planes, camera distance, rotation speed/tilt).

- `math.ts`
  Mesh and matrix helpers. Builds parametric meshes from topology parametrizations and provides matrix transforms (perspective, rotate, translate, multiply).

- `shaders.ts`
  GLSL shader source plus shader/program compile and link helpers.

- `types.ts`
  Local TypeScript types for canvas props, mesh data, and extended WebGL context typing for `texElementImage2D`.

- `index.ts`
  Barrel export for the canvas component.

## Keep in mind

- This module assumes HTML-in-canvas support is enabled in Chrome (experimental feature flag).
- Topology data is passed in via props; topology definitions live outside this folder.
