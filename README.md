# Go WASM Playground

A Playground for building **Conway's Game of Life** in Go, compiled to WebAssembly, and rendered on an HTML canvas via React.

> **Status:** base infrastructure is in place. Game of Life logic and canvas rendering are not yet implemented.

---


## Project Structure

```
wasm/                  Each subdirectory is a separate Go package → separate .wasm
  main.go              Root package  → public/main.wasm
  gameOfLife/          Subdirectory  → public/gameOfLife/gameOfLife.wasm
    game.go

src/
  hooks/
    useGoWasm.ts      Loads and runs a .wasm binary, resolves the api object
  components/
    Canvas.tsx        Canvas stub — Game of Life render related code goes here.
  @types/             Auto-generated (DO NOT EDIT) — mirrors wasm/ structure
    main.d.ts
    gameOfLife/
      gameOfLife.d.ts

tools/
  gen-wasm-types/
    main.go           Codegen tool: walks wasm/, emits src/@types/**/*.d.ts

public/
  main.wasm           Compiled outputs (generated, not committed)
  gameOfLife/
    gameOfLife.wasm
  wasm_exec.js        Go runtime glue (auto-synced from local Go install)
```

---

## Prerequisites

- [Go](https://go.dev/) 1.21+
- [Node.js](https://nodejs.org/) 18+

---

## Development

```bash
npm install
npm run dev
```

`npm run dev` does the following before starting Vite:

1. Runs `go generate` in `wasm/` to regenerate `src/@types/*.d.ts`
2. Vite starts and the custom `vite-plugin-auto-go-wasm` plugin kicks in:
   - **Syncs `wasm_exec.js`** — locates the file from your local Go installation (`$(go env GOROOT)/misc/wasm/wasm_exec.js`) and copies it into `public/`. No manual download needed.
   - **Cleans stale outputs** — any `.wasm` files in `public/` that no longer correspond to a package in `wasm/` are deleted before building.
   - **Compiles all WASM packages** — recursively scans `wasm/` for `package main` directories and runs `GOOS=js GOARCH=wasm go build` for each in parallel. Output mirrors the source structure: `wasm/gameOfLife/` → `public/gameOfLife/gameOfLife.wasm`.
   - **Hot-reloads on Go changes** — watches all `.go` files under `wasm/`; any save recompiles all packages and triggers a full browser reload only on success.

---

## Production Build

```bash
npm run build
```

Same pre-build steps apply (type gen + WASM compile), then Vite bundles the React app.

---

## TypeScript Types for the Go API

Types are auto-generated from `// @ts:` annotations on Go functions:

```go
// @ts: (a: number, b: number) => number
func add(this js.Value, args []js.Value) any { ... }
```

Running `npm run gen` (or `go generate` from `wasm/`) walks every `package main` directory under `wasm/`, extracts those annotations from all files in the package, and writes one `.d.ts` per package into `src/@types/`, mirroring the directory structure. The generated files are checked in so TypeScript always has types available without requiring a Go toolchain.

---

## Using the WASM API in React

```tsx
import { useGoWasm } from './hooks/useGoWasm';
import type GameOfLifeApi from './@types/gameOfLife/gameOfLife';

function App() {
  const { api, isReady } = useGoWasm<GameOfLifeApi>('/gameOfLife/gameOfLife.wasm');

  if (!isReady) return <p>Loading…</p>;
  return <canvas />;
}
```

