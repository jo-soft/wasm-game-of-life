import { useState } from 'react'
import { useGoWasm } from './hooks/useGoWasm'
import type GameOfLifeApi from './@types/gameOfLife/gameOfLife'
import Canvas from './components/Canvas';

export function App() {
  const { api, isReady, error } = useGoWasm<GameOfLifeApi>('/gameOfLife/gameOfLife.wasm');

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <p>WASM Status: {isReady ? 'Ready ✅' : 'Initializing...'}</p>

      { api ? 
        <Canvas rows={20} cols={20} topology="sphere" padding={10} gridColor="#ccc" highlightColor="rgba(0, 128, 255, 0.3)" />
        : <p>Loading WASM API...</p>
      }
    </div>
  )
}

export default App