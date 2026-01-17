import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Note } from "../../../shared/types.js";
import { getUniqueLinks } from "../../../shared/links.js";

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphViewProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

// Stable hash for notes array to detect actual changes
function notesHash(notes: Note[]): string {
  return notes.map(n => n.title).sort().join("|");
}

export function GraphView({
  notes,
  selectedNote,
  onSelectNote,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animationRef = useRef<number>(0);
  const isSimulatingRef = useRef(false);
  const lastNotesHashRef = useRef<string>("");
  const simulationTickRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  const [size, setSize] = useState({ width: 0, height: 0 });
  const sizeReady = size.width > 0 && size.height > 0;
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  // Keep refs in sync with state for use in animation loop
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Memoize notes hash to detect changes
  const currentNotesHash = useMemo(() => notesHash(notes), [notes]);

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Build graph data from notes - only when notes actually change
  useEffect(() => {
    // Wait for container to have a real size
    if (!sizeReady) return;

    const notesChanged = currentNotesHash !== lastNotesHashRef.current;
    const sizeChanged = lastSizeRef.current.width > 0 &&
      (size.width !== lastSizeRef.current.width || size.height !== lastSizeRef.current.height);
    const needsInitialBuild = !hasInitializedRef.current;

    // Skip if nothing changed
    if (!notesChanged && !needsInitialBuild && !sizeChanged) {
      return;
    }

    // If only size changed (not notes), just recenter existing nodes
    if (sizeChanged && hasInitializedRef.current && !notesChanged && nodesRef.current.length > 0) {
      const oldCenterX = lastSizeRef.current.width / 2;
      const oldCenterY = lastSizeRef.current.height / 2;
      const newCenterX = size.width / 2;
      const newCenterY = size.height / 2;
      const dx = newCenterX - oldCenterX;
      const dy = newCenterY - oldCenterY;

      // Shift all nodes by the center difference
      for (const node of nodesRef.current) {
        node.x += dx;
        node.y += dy;
      }

      lastSizeRef.current = { width: size.width, height: size.height };
      draw();
      return;
    }

    lastNotesHashRef.current = currentNotesHash;
    lastSizeRef.current = { width: size.width, height: size.height };

    const buildGraph = async () => {
      const nodeMap = new Map<string, GraphNode>();
      const edgeList: GraphEdge[] = [];

      // Keep existing positions for nodes that still exist
      const existingPositions = new Map<string, { x: number; y: number; pinned: boolean }>();
      for (const node of nodesRef.current) {
        existingPositions.set(node.id, { x: node.x, y: node.y, pinned: node.pinned });
      }

      // Use actual canvas center for initial layout
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const radius = Math.min(size.width, size.height) / 3;

      notes.forEach((note, i) => {
        const existing = existingPositions.get(note.title);
        const angle = (2 * Math.PI * i) / notes.length;
        nodeMap.set(note.title, {
          id: note.title,
          title: note.title,
          x: existing?.x ?? (centerX + radius * Math.cos(angle)),
          y: existing?.y ?? (centerY + radius * Math.sin(angle)),
          vx: 0,
          vy: 0,
          pinned: existing?.pinned ?? false,
        });
      });

      for (const note of notes) {
        try {
          const content = await window.api.notes.read(note.path);
          const links = getUniqueLinks(content);
          for (const link of links) {
            if (nodeMap.has(link)) {
              edgeList.push({ source: note.title, target: link });
            }
          }
        } catch {
          // Skip if can't read
        }
      }

      nodesRef.current = Array.from(nodeMap.values());
      edgesRef.current = edgeList;
      simulationTickRef.current = 0;
      hasInitializedRef.current = true;

      // Start simulation
      startSimulation();
    };

    buildGraph();
  }, [currentNotesHash, size.width, size.height, sizeReady]);

  // Draw function using refs for pan/zoom to avoid stale closures
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const currentPan = panRef.current;
    const currentZoom = zoomRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transform
    ctx.save();
    ctx.translate(currentPan.x + size.width / 2, currentPan.y + size.height / 2);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-size.width / 2, -size.height / 2);

    // Draw edges
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1 / currentZoom;
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }

    // Determine if we should show labels
    const showAllLabels = nodes.length <= 10 || currentZoom >= 0.8;

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNote?.title === node.id;
      const isHovered = hoveredNode === node.id;

      const nodeRadius = (isHovered ? 10 : 8) / currentZoom;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#6b9eff" : isHovered ? "#888" : "#555";
      ctx.fill();

      // Draw label - only for hovered/selected when too many nodes, or always if few nodes
      if (showAllLabels || isHovered || isSelected) {
        ctx.fillStyle = "#e0e0e0";
        const fontSize = Math.max(10, 12 / currentZoom);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.title, node.x, node.y + nodeRadius + fontSize + 2);
      }
    }

    ctx.restore();
  }, [selectedNote, hoveredNode, size]);

  // Simulation function - uses refs to avoid recreating
  const simulate = useCallback(() => {
    if (!isSimulatingRef.current) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    if (nodes.length === 0) {
      isSimulatingRef.current = false;
      return;
    }

    simulationTickRef.current++;
    let totalMovement = 0;

    // Stronger repulsion for more separation
    const repulsionStrength = 2000;
    // Weaker attraction
    const attractionStrength = 0.003;
    // Stronger center gravity to keep things together
    const centerGravity = 0.001;
    // Higher damping for faster settling
    const damping = 0.7;

    const centerX = size.width / 2;
    const centerY = size.height / 2;

    for (const node of nodes) {
      if (node.pinned || node.id === draggedNode) continue;

      let fx = 0;
      let fy = 0;

      // Repulsion from other nodes
      for (const other of nodes) {
        if (node.id === other.id) continue;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;

        // Minimum distance to prevent nodes from getting too close
        const minDist = 80;
        if (dist < minDist) {
          const force = repulsionStrength / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        } else {
          const force = repulsionStrength / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        let other: GraphNode | undefined;
        if (edge.source === node.id) {
          other = nodes.find((n) => n.id === edge.target);
        } else if (edge.target === node.id) {
          other = nodes.find((n) => n.id === edge.source);
        }
        if (other) {
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Only attract if they're far apart
          if (dist > 100) {
            fx += dx * attractionStrength;
            fy += dy * attractionStrength;
          }
        }
      }

      // Center gravity
      fx += (centerX - node.x) * centerGravity;
      fy += (centerY - node.y) * centerGravity;

      // Apply forces to velocity
      node.vx += fx;
      node.vy += fy;

      // Apply damping
      node.vx *= damping;
      node.vy *= damping;

      // Clamp velocity
      const maxVel = 20;
      const vel = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (vel > maxVel) {
        node.vx = (node.vx / vel) * maxVel;
        node.vy = (node.vy / vel) * maxVel;
      }

      const oldX = node.x;
      const oldY = node.y;

      node.x += node.vx;
      node.y += node.vy;

      // Soft bounds - push back from edges
      const margin = 60;
      if (node.x < margin) node.vx += (margin - node.x) * 0.1;
      if (node.x > size.width - margin) node.vx += (size.width - margin - node.x) * 0.1;
      if (node.y < margin) node.vy += (margin - node.y) * 0.1;
      if (node.y > size.height - margin) node.vy += (size.height - margin - node.y) * 0.1;

      totalMovement += Math.abs(node.x - oldX) + Math.abs(node.y - oldY);
    }

    draw();

    // Stop simulation when settled or after max ticks
    const maxTicks = 500;
    if ((totalMovement < 0.5 && simulationTickRef.current > 50) || simulationTickRef.current > maxTicks) {
      isSimulatingRef.current = false;
      return;
    }

    animationRef.current = requestAnimationFrame(simulate);
  }, [draggedNode, size, draw]);

  const startSimulation = useCallback(() => {
    if (isSimulatingRef.current) return;
    isSimulatingRef.current = true;
    simulationTickRef.current = 0;
    animationRef.current = requestAnimationFrame(simulate);
  }, [simulate]);

  // Restart simulation when drag ends
  useEffect(() => {
    if (!draggedNode && nodesRef.current.length > 0) {
      // Small delay to let the node settle
      setTimeout(() => {
        simulationTickRef.current = 0;
        startSimulation();
      }, 50);
    }
  }, [draggedNode, startSimulation]);

  // Redraw when visual state changes (but don't restart simulation)
  useEffect(() => {
    draw();
  }, [draw, selectedNote, hoveredNode, zoom, pan]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      isSimulatingRef.current = false;
    };
  }, []);

  // Convert screen coordinates to graph coordinates
  const screenToGraph = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // Reverse the transform
    const graphX = (canvasX - pan.x - size.width / 2) / zoom + size.width / 2;
    const graphY = (canvasY - pan.y - size.height / 2) / zoom + size.height / 2;

    return { x: graphX, y: graphY };
  }, [pan, zoom, size]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);

    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (draggedNode) {
      const nodes = nodesRef.current;
      const node = nodes.find(n => n.id === draggedNode);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        draw();
      }
      return;
    }

    // Check hover
    const nodes = nodesRef.current;
    let found: string | null = null;
    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const hitRadius = 15 / zoom;
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        found = node.id;
        break;
      }
    }
    setHoveredNode(found);
  }, [draggedNode, isPanning, screenToGraph, zoom, draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right mouse button for panning
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Left click for dragging nodes
    if (e.button === 0 && hoveredNode) {
      setDraggedNode(hoveredNode);
    }
  }, [hoveredNode]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      setIsPanning(false);
    }
    if (e.button === 0) {
      setDraggedNode(null);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode && !draggedNode) {
      const note = notes.find((n) => n.title === hoveredNode);
      if (note) onSelectNote(note);
    }
  }, [hoveredNode, draggedNode, notes, onSelectNote]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Zoom centered on mouse position
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor));

    // Adjust pan to zoom toward mouse position
    const zoomChange = newZoom / zoom;
    const centerX = size.width / 2;
    const centerY = size.height / 2;

    setPan(p => ({
      x: mouseX - centerX - (mouseX - centerX - p.x) * zoomChange,
      y: mouseY - centerY - (mouseY - centerY - p.y) * zoomChange,
    }));

    setZoom(newZoom);
  }, [zoom, size]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Reset view
  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="graph-view-container"
    >
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className={hoveredNode ? "cursor-pointer" : isPanning ? "cursor-grabbing" : "cursor-grab"}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setDraggedNode(null);
          setIsPanning(false);
          setHoveredNode(null);
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      {zoom !== 1 && (
        <div className="graph-zoom-indicator">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
