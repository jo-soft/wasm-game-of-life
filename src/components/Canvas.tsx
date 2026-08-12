import React, { useEffect, useRef, useState } from 'react';


interface Coordinate {
    x: number;
    y: number;
}

interface Cell {
    col: number;
    row: number;
}

type TopologyType = 'torus' | 'klein' | 'mobius' | 'projective';

interface CanvasProps {
    rows?: number;
    cols?: number;
    topology: TopologyType;
    gridColor?: string;
    padding?: number;
    highlightColor?: string;
    internalWidth?: number;
    internalHeight?: number;
}

const Canvas: React.FC<CanvasProps> = ({
    rows = 10,
    cols = 10,
    topology,
    gridColor = '#cccccc',
    padding = 60, // Increased slightly to give space for topology arrows
    highlightColor = 'rgba(0, 255, 0, 0.4)', // Soft green overlay for hovered cell
    internalWidth = 800,
    internalHeight = 600
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePos, setMousePos] = useState<Coordinate | null>(null);

    // Converts client bounding box mouse positions into internal Canvas pixels
    const getCanvasCoordinates = (mouseCoord: Coordinate | null): Coordinate | null => {
        if (!mouseCoord || !canvasRef.current) return null;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return { 
            x: mouseCoord.x * scaleX, 
            y: mouseCoord.y * scaleY 
        };
    };

    // Finds the 2D cell row/col index based on internal canvas coordinates
    const getHoveredCell = (canvasX: number, canvasY: number): Cell | null => {
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current;

        // Return null if mouse is outside the playable grid inside the padding zone
        if (canvasX < padding || canvasX > canvas.width - padding ||
            canvasY < padding || canvasY > canvas.height - padding) {
            return null;
        }

        const usableWidth = canvas.width - (2 * padding);
        const usableHeight = canvas.height - (2 * padding);

        const col = Math.floor(((canvasX - padding) / usableWidth) * cols);
        const row = Math.floor(((canvasY - padding) / usableHeight) * rows);

        // Clamp checks
        if (col < 0 || col >= cols || row < 0 || row >= rows) return null;

        return { col, row };
    };

    const canvasCoordinates = getCanvasCoordinates(mousePos);
    const hoveredCell = canvasCoordinates ? getHoveredCell(canvasCoordinates.x, canvasCoordinates.y) : null;

    // Helper to draw topology indicator arrows in the margins
    const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        // Draw main line
        ctx.beginPath();
        ctx.moveTo(x - dx * 0.5, y - dy * 0.5);
        ctx.lineTo(x + dx * 0.5, y + dy * 0.5);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(x + dx * 0.5, y + dy * 0.5);
        ctx.lineTo(x + dx * 0.5 - 10 * Math.cos(angle - Math.PI / 6), y + dy * 0.5 - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x + dx * 0.5 - 10 * Math.cos(angle + Math.PI / 6), y + dy * 0.5 - 10 * Math.sin(angle + Math.PI / 6));
        ctx.fill();
        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const usableWidth = canvas.width - (2 * padding);
        const usableHeight = canvas.height - (2 * padding);
        const cellW = usableWidth / cols;
        const cellH = usableHeight / rows;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Draw Grid Squares
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(padding + c * cellW, padding);
            ctx.lineTo(padding + c * cellW, canvas.height - padding);
            ctx.stroke();
        }

        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(padding, padding + r * cellH);
            ctx.lineTo(canvas.width - padding, padding + r * cellH);
            ctx.stroke();
        }

        // --- Topological Identification Arrow Markers ---
        const midX = padding + usableWidth / 2;
        const midY = padding + usableHeight / 2;
        const offset = 25; // How far into the margin the arrow sits

        // Left / Right Boundaries (Red Group)
        if (topology === 'torus' || topology === 'klein') {
            // Straight Gluing: Both point UP
            drawArrow(ctx, padding - offset, midY, 0, -30, '#ff3333');
            drawArrow(ctx, canvas.width - padding + offset, midY, 0, -30, '#ff3333');
        } else if (topology === 'mobius' || topology === 'projective') {
            // Twisted/Flipped Gluing: Left points UP, Right points DOWN
            drawArrow(ctx, padding - offset, midY, 0, -30, '#ff3333');
            drawArrow(ctx, canvas.width - padding + offset, midY, 0, 30, '#ff3333');
        }

        // Top / Bottom Boundaries (Blue Group)
        if (topology === 'torus' || topology === 'mobius') {
            // Straight Gluing: Both point RIGHT
            drawArrow(ctx, midX, padding - offset, 30, 0, '#3333ff');
            drawArrow(ctx, midX, canvas.height - padding + offset, 30, 0, '#3333ff');
        } else if (topology === 'klein' || topology === 'projective') {
            // Twisted/Flipped Gluing: Top points RIGHT, Bottom points LEFT
            drawArrow(ctx, midX, padding - offset, 30, 0, '#3333ff');
            drawArrow(ctx, midX, canvas.height - padding + offset, -30, 0, '#3333ff');
        }
    };

    const drawHighlight = (ctx: CanvasRenderingContext2D, cell: Cell) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const usableWidth = canvas.width - (2 * padding);
        const usableHeight = canvas.height - (2 * padding);
        const cellW = usableWidth / cols;
        const cellH = usableHeight / rows;

        const x = padding + cell.col * cellW;
        const y = padding + cell.row * cellH;

        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, cellW, cellH);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawGrid(ctx);
        
        if (hoveredCell !== null) {
            drawHighlight(ctx, hoveredCell);
        }   
    }, [rows, cols, topology, mousePos, padding, gridColor, highlightColor]);

    const handleMouseMove = (evt: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void =>  {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        setMousePos({
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        });
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block', fontFamily: 'sans-serif' }}>
            <div style={{ marginBottom: '8px' }}>
                <strong>Active Topology:</strong> {topology.toUpperCase()} 
                {hoveredCell && ` | Hovered Cell: [Col: ${hoveredCell.col}, Row: ${hoveredCell.row}]`}
            </div>
            
            <canvas
                width={internalWidth}
                height={internalHeight}
                style={{ display: 'block', border: '1px solid #ccc', backgroundColor: '#fafafa' }} 
                ref={canvasRef} 
                onMouseMove={handleMouseMove} 
                onMouseLeave={() => setMousePos(null)}
            />
                
            {mousePos && hoveredCell && (
                <div style={{ 
                    position: 'absolute', 
                    left: mousePos.x + 15, 
                    top: mousePos.y + 40, 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    padding: '6px 10px', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.15)'
                }}>
                    <strong>X:</strong> {hoveredCell.col}, <strong>Y:</strong> {hoveredCell.row}
                </div>
            )}
        </div>
    );
};

export default Canvas;