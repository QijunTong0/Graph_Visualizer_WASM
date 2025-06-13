import React, { useEffect, useRef, useState } from "react";

// Types for vertices and edges
type Vertex = {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
};

type Edge = {
    source: number;
    target: number;
};

// Graph generation utility
function generateRandomGraph(numVertices: number, numEdges: number): {
    vertices: Vertex[];
    edges: Edge[];
} {
    // Place vertices randomly in a 800x600 area
    const vertices: Vertex[] = [];
    for (let i = 0; i < numVertices; i++) {
        vertices.push({
            id: i,
            x: Math.random() * 800,
            y: Math.random() * 600,
            dx: 0,
            dy: 0,
        });
    }

    const edgeSet = new Set<string>();
    const edges: Edge[] = [];
    while (edges.length < numEdges) {
        const a = Math.floor(Math.random() * numVertices);
        let b = Math.floor(Math.random() * numVertices);
        while (b === a) b = Math.floor(Math.random() * numVertices);
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({ source: a, target: b });
        }
    }
    return { vertices, edges };
}

// Fruchterman-Reingold algorithm step
function fruchtermanReingoldStep(
    vertices: Vertex[],
    edges: Edge[],
    width: number,
    height: number,
    k: number,
    temperature: number
): number {
    const area = width * height;
    // Repulsive force
    for (let v of vertices) {
        v.dx = 0;
        v.dy = 0;
        for (let u of vertices) {
            if (u.id !== v.id) {
                let dx = v.x - u.x;
                let dy = v.y - u.y;
                let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
                let force = (k * k) / dist;
                v.dx += (dx / dist) * force;
                v.dy += (dy / dist) * force;
            }
        }
    }
    // Attractive force
    for (let e of edges) {
        const v = vertices[e.source];
        const u = vertices[e.target];
        let dx = v.x - u.x;
        let dy = v.y - u.y;
        let dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        let force = (dist * dist) / k;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        v.dx -= fx;
        v.dy -= fy;
        u.dx += fx;
        u.dy += fy;
    }
    // Limit max displacement and update positions
    let maxMove = 0;
    for (let v of vertices) {
        let dx = v.dx;
        let dy = v.dy;
        let disp = Math.sqrt(dx * dx + dy * dy);
        if (disp > temperature) {
            dx = (dx / disp) * temperature;
            dy = (dy / disp) * temperature;
        }
        v.x += dx;
        v.y += dy;
        // Keep within bounds
        v.x = Math.min(width, Math.max(0, v.x));
        v.y = Math.min(height, Math.max(0, v.y));
        if (disp > maxMove) maxMove = disp;
    }
    return maxMove;
}

const WIDTH = 800;
const HEIGHT = 600;
const NUM_VERTICES = 30;
const NUM_EDGES = 60;

const GraphVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [vertices, setVertices] = useState<Vertex[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [running, setRunning] = useState(true);
    const [iteration, setIteration] = useState(0);
    const [temperature, setTemperature] = useState(100);
    const [maxMove, setMaxMove] = useState(0);

    // Initialize graph
    useEffect(() => {
        const { vertices, edges } = generateRandomGraph(NUM_VERTICES, NUM_EDGES);
        setVertices(vertices);
        setEdges(edges);
        setIteration(0);
        setTemperature(100);
        setRunning(true);
    }, []);

    // Animation loop
    useEffect(() => {
        if (!running) return;
        let frame: number;
        const step = () => {
            if (vertices.length === 0) return;
            // Typical optimal distance
            const k = Math.sqrt((WIDTH * HEIGHT) / NUM_VERTICES);
            // Copy vertices for mutation
            const verts = vertices.map(v => ({ ...v }));
            const move = fruchtermanReingoldStep(verts, edges, WIDTH, HEIGHT, k, temperature);
            setVertices(verts);
            setIteration(iteration => iteration + 1);
            setTemperature(t => t * 0.95); // Cool down
            setMaxMove(move);
            if (move < 0.5 || temperature < 1) {
                setRunning(false);
            } else {
                frame = requestAnimationFrame(step);
            }
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line
    }, [running, vertices, edges, temperature]);

    // Draw graph
    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw edges with semi-transparent lines and subtle glow
        for (let e of edges) {
            const v = vertices[e.source];
            const u = vertices[e.target];
            ctx.save();
            ctx.strokeStyle = "rgba(33, 203, 243, 0.18)";
            ctx.shadowColor = "#1976d2";
            ctx.shadowBlur = 4;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(v.x, v.y);
            ctx.lineTo(u.x, u.y);
            ctx.stroke();
            ctx.restore();
        }

        // Draw vertices with gradient, glow, and drop shadow
        for (let v of vertices) {
            ctx.save();
            // Glow
            ctx.shadowColor = "#21cbf3";
            ctx.shadowBlur = 16;
            // Gradient fill
            const grad = ctx.createRadialGradient(v.x, v.y, 2, v.x, v.y, 12);
            grad.addColorStop(0, "#21cbf3");
            grad.addColorStop(0.5, "#1976d2");
            grad.addColorStop(1, "#232526");
            ctx.beginPath();
            ctx.arc(v.x, v.y, 12, 0, 2 * Math.PI);
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.92;
            ctx.fill();
            // Node border
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#fff";
            ctx.globalAlpha = 1;
            ctx.stroke();
            ctx.restore();

            // Node id
            ctx.save();
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px 'Inter', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#232526";
            ctx.shadowBlur = 4;
            ctx.fillText(String(v.id), v.x, v.y);
            ctx.restore();
        }
    }, [vertices, edges, iteration]);

    const handleReset = () => {
        const { vertices, edges } = generateRandomGraph(NUM_VERTICES, NUM_EDGES);
        setVertices(vertices);
        setEdges(edges);
        setIteration(0);
        setTemperature(100);
        setRunning(true);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className="graph-canvas"
            />
            <div className="controls-bar">
                <button onClick={() => setRunning(r => !r)}>
                    {running ? "Pause" : "Resume"}
                </button>
                <button onClick={handleReset}>
                    Reset
                </button>
            </div>
            <div className="stats-bar">
                Iteration: {iteration} &nbsp;|&nbsp; Max Move: {maxMove.toFixed(2)} &nbsp;|&nbsp; Temp: {temperature.toFixed(2)}
            </div>
        </div>
    );
};

export default GraphVisualizer;
