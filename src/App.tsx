import { useState } from 'react'
import { useGoWasm } from './hooks/useGoWasm'
import type GameOfLifeApi from './@types/gameOfLife/gameOfLife'
import Canvas from './components/canvas'
import { Topologies } from './topologies'
import './App.css'

const ROWS = 2**5;
const COLS = 2**5;
const alivePerventage = 0.5;

const totalCells = ROWS * COLS;
const trueCount = Math.floor(totalCells * alivePerventage);

const flatGrid = Array.from({ length: totalCells }, (_, i) => i < trueCount);

for (let i = flatGrid.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
}

const randomGrid: boolean[][] = Array.from({ length: ROWS }, (_, r) => 
  Array.from({ length: COLS }, (_, c) => flatGrid[r * COLS + c])
);

export function App() {
  const { api, isReady, error } = useGoWasm<GameOfLifeApi>('/gameOfLife/gameOfLife.wasm');
  const [grid] = useState<boolean[][]>(randomGrid);

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div className="app">
      <p className="app__status">WASM Status: {isReady ? 'Ready ✅' : 'Initializing...'}</p>
      <p className="app__status">API: {api ? 'Connected' : 'Waiting...'}</p>
      <div className="app__canvas-container">
        <Canvas grid={grid} topology={Topologies.mobiusBand} />
      </div>
    </div>
  )
}

export default App