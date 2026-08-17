import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Go: new () => {
      importObject: WebAssembly.Imports;
      run: (instance: WebAssembly.Instance) => Promise<void>;
    };
    __wasmReadyPromise__?: Promise<unknown>;
  }
}

interface UseGoWasmResult<T = unknown> {
  api: T | null;
  isReady: boolean;
  error: string | null;
}

export function useGoWasm<T = unknown>(
  wasmUrl: string,
  scriptUrl: string = '/wasm_exec.js'
): UseGoWasmResult<T> {
  const [wasmApi, setWasmApi] = useState<T | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        if (typeof window.Go === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${scriptUrl}`));
            document.head.appendChild(script);
          });
        }

        const go = new window.Go();
        const response = await fetch(wasmUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer, go.importObject);

        // Run the instance. Go's runtime block handles the event loop.
        go.run(instance).catch((err) => console.error('[go-wasm] Runtime error:', err));

        // Wait for the Go code to populate the promise and resolve it
        const api = (await window.__wasmReadyPromise__) as T;
        delete window.__wasmReadyPromise__;

        if (isMounted) {
          setWasmApi(api);
          setIsReady(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'WASM load error');
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [wasmUrl, scriptUrl]);

  return { api: wasmApi, isReady, error };
}
