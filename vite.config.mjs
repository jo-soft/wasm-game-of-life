import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import { execSync, exec } from 'child_process'
import fs from 'fs'
import path from 'path'

function autoGoWasmPlugin() {
  const findWasmExecPath = () => {
    try {
      const goRoot = execSync('go env GOROOT', { encoding: 'utf-8' }).trim()
      const candidates = [
        path.join(goRoot, 'misc', 'wasm', 'wasm_exec.js'),
        path.join(goRoot, 'lib', 'misc', 'wasm', 'wasm_exec.js'),
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) return p
      }
    } catch (_) {}

    try {
      const found = execSync('find /usr/share /usr/lib -name "wasm_exec.js" 2>/dev/null | head -n 1', { encoding: 'utf-8' }).trim()
      if (found && fs.existsSync(found)) return found
    } catch (_) {}

    return null
  }

  const syncWasmExec = () => {
    const publicDir = path.resolve(import.meta.dirname, 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const sourcePath = findWasmExecPath()
    if (!sourcePath) {
      console.error('\n❌ [go-wasm] could not find wasm_exec.js on this system.')
      return
    }

    fs.copyFileSync(sourcePath, path.join(publicDir, 'wasm_exec.js'))
    console.log(`[go-wasm] Synced wasm_exec.js from: ${sourcePath}`)
  }

  const compileGo = () => {
    const wasmDir = path.resolve(import.meta.dirname, 'wasm')
    const publicDir = path.resolve(import.meta.dirname, 'public')

    // Recursively find directories that contain a `package main` Go file
    const collectPackages = (dir) => {
      const packages = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const isMain = entries
        .filter(e => !e.isDirectory() && e.name.endsWith('.go') && !e.name.endsWith('_test.go'))
        .some(e => /^\s*package\s+main\b/m.test(fs.readFileSync(path.join(dir, e.name), 'utf-8')))
      if (isMain) packages.push(dir)
      for (const e of entries)
        if (e.isDirectory()) packages.push(...collectPackages(path.join(dir, e.name)))
      return packages
    }

    // Recursively collect all .wasm files under a directory
    const collectWasmFiles = (dir) => {
      if (!fs.existsSync(dir)) return []
      const results = []
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) results.push(...collectWasmFiles(full))
        else if (e.name.endsWith('.wasm')) results.push(full)
      }
      return results
    }

    const pkgDirs = collectPackages(wasmDir)
    if (pkgDirs.length === 0) {
      console.warn('[go-wasm] No package main found in wasm/')
      return Promise.resolve()
    }

    // Determine the set of wasm files that will be produced
    const expectedWasm = new Set(pkgDirs.map((pkgDir) => {
      const relDir = path.relative(wasmDir, pkgDir)
      const dirName = relDir === '' ? 'main' : path.basename(relDir)
      const outRel = relDir === '' ? 'main.wasm' : path.join(relDir, `${dirName}.wasm`)
      return path.join(publicDir, outRel)
    }))

    // Delete any .wasm files in public/ that are no longer expected
    for (const stale of collectWasmFiles(publicDir)) {
      if (!expectedWasm.has(stale)) {
        fs.rmSync(stale)
        console.log(`[go-wasm] Removed stale ${path.relative(publicDir, stale)}`)
      }
    }

    const tasks = pkgDirs.map((pkgDir) => {
      const relDir = path.relative(wasmDir, pkgDir)          // '' | 'gameOfLife' | 'a/b'
      const dirName = relDir === '' ? 'main' : path.basename(relDir)
      const outRel = relDir === '' ? 'main.wasm' : path.join(relDir, `${dirName}.wasm`)
      const outAbs = path.join(publicDir, outRel)
      const pkgImport = relDir === '' ? '.' : `./${relDir}`    // relative to wasmDir
      fs.mkdirSync(path.dirname(outAbs), { recursive: true })

      return new Promise((resolve, reject) => {
        console.log(`[go-wasm] Compiling wasm/${relDir || '.'} -> public/${outRel}...`)
        exec(
          `GOOS=js GOARCH=wasm go build -o ${outAbs} ${pkgImport}`,
          { cwd: wasmDir },
          (err, _stdout, stderr) => {
            if (err) {
              console.error(`[go-wasm] Build error (${pkgImport}):`, stderr)
              reject(err)
            } else {
              console.log(`[go-wasm] Built public/${outRel} ✅`)
              resolve()
            }
          }
        )
      })
    })

    return Promise.all(tasks)
  }

  const genTypes = () =>
    new Promise((resolve, reject) => {
      const wasmDir = path.resolve(import.meta.dirname, 'wasm')
      exec('go generate', { cwd: wasmDir }, (err, _stdout, stderr) => {
        if (err) {
          console.error('[go-wasm] Type gen error:', stderr)
          reject(err)
        } else {
          console.log('[go-wasm] Types regenerated ✅')
          resolve()
        }
      })
    })

  return {
    name: 'vite-plugin-auto-go-wasm',

    // Runs synchronously before Vite serves static files
    async buildStart() {
      syncWasmExec()
      try {
        await compileGo()
        await genTypes()
      } catch {
        // errors already logged; don't abort the dev server
      }
    },

    // Watch wasm/*.go files and reload browser on change
    configureServer(server) {
      const wasmDir = path.resolve(import.meta.dirname, 'wasm')
      server.watcher.add(wasmDir)

      server.watcher.on('change', async (filePath) => {
        if (filePath.startsWith(wasmDir) && filePath.endsWith('.go')) {
          try {
            await compileGo()
            await genTypes()
          } catch {
            return // errors already logged; skip reload
          }
          server.ws.send({ type: 'full-reload' })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(), 
    glsl(),
    autoGoWasmPlugin()],
})