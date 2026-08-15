# Go WASM Playground

A playground for running Go WebAssembly modules in a React app and rendering an interactive grid onto a 3D surface with the HTML-in-canvas API.

## Project Structure (High-Level)

The repository is organized into a few main areas:

- `src/`: React + TypeScript app code
- `wasm/`: Go source that is compiled to WebAssembly
- `public/`: generated runtime artifacts served by Vite (`.wasm`, `wasm_exec.js`)
- `tools/`: helper tooling (for example, type generation)
- `.husky/`: Git hooks (pre-commit linting)

Inside `src/`, the app is split into UI components, rendering, hooks, topology definitions, and generated types.
For a focused breakdown of each directory check the `Readme.md` in the directory.

## Big Picture

The project has three main layers:

1. Go/WASM runtime layer
- Go packages are compiled to `.wasm` and served from `public/`.
- `wasm_exec.js` is synced automatically from your local Go install.

2. Type-safe app layer
- TypeScript declaration files for WASM-exposed APIs are generated from Go annotations.
- React code consumes WASM through a typed hook instead of direct global access.

3. Rendering layer
- A React canvas component renders WebGL geometry.
- HTML grid content is projected into a WebGL texture using HTML-in-canvas APIs.

## Development Workflow

```bash
npm install
npm run dev
```

What happens during normal development:

1. Go types are regenerated.
2. WASM outputs are rebuilt and synced.
3. Vite serves the React app with live reload.

Production build:

```bash
npm run build
```

## Linting And Hooks

```bash
npm run lint
```

Git pre-commit runs lint automatically through Husky.

## HTML-in-Canvas Note

At the time of writing, HTML-in-canvas is still experimental. You need to run Chrome with the relevant feature flag enabled (`chrome://flags/#canvas-draw-element`).

## Type Generation In Short

Go functions annotated with `// @ts:` are used to generate TypeScript API declarations. Treat generated type files as build artifacts; do not hand-edit them.

