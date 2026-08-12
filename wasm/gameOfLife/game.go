package main

import (
	"syscall/js"
)

// @ts: () => void
func dummy(this js.Value, args []js.Value) any {
	return nil
}

func main() {
	var resolveFunc js.Value
	promiseHandler := js.FuncOf(func(this js.Value, args []js.Value) any {
		resolveFunc = args[0] // Capture the promise's resolve function
		return nil
	})

	// window.__wasmReadyPromise__ = new Promise((resolve) => { resolveFunc = resolve })
	jsPromise := js.Global().Get("Promise").New(promiseHandler)
	js.Global().Set("__wasmReadyPromise__", jsPromise)

	// Build the API object containing Go functions
	api := map[string]any{
		"dummy": js.FuncOf(dummy),
	}

	resolveFunc.Invoke(js.ValueOf(api))

	// Keep Go runtime alive in background
	select {}
}
