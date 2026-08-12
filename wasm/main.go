package main

import (
	"syscall/js"
)

// @ts: (a: number, b: number) => number
func add(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return 0
	}
	return js.ValueOf(args[0].Int() + args[1].Int())
}

// @ts: (a: number, b: number) => number
func multiply(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return 0
	}
	return js.ValueOf(args[0].Int() * args[1].Int())
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
		"add":      js.FuncOf(add),
		"multiply": js.FuncOf(multiply),
	}

	resolveFunc.Invoke(js.ValueOf(api))

	// Keep Go runtime alive in background
	select {}
}
