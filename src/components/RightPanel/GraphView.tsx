import { useState, useEffect, useRef } from "react";
import type { Note } from "../../../shared/types.js";
import { getUniqueLinks } from "../../../shared/links.js";

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
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

export function GraphView({
  notes,
  selectedNote,
  onSelectNote,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 300, height: 400 });
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);

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

  // Build graph data from notes
  useEffect(() => {
    const buildGraph = async () => {
      const nodeMap = new Map<string, GraphNode>();
      const edgeList: GraphEdge[] = [];

      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const radius = Math.min(size.width, size.height) / 3;

      notes.forEach((note, i) => {
        const angle = (2 * Math.PI * i) / notes.length;
        nodeMap.set(note.title, {
          id: note.title,
          title: note.title,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
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

      const nodeList = Array.from(nodeMap.values());
      setNodes(nodeList);
      nodesRef.current = nodeList;
      setEdges(edgeList);
    };

    buildGraph();
  }, [notes, size]);

  // Simple force-directed layout simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      const currentNodes = nodesRef.current;
      const updatedNodes = currentNodes.map((node) => ({ ...node }));

      for (const node of updatedNodes) {
        if (node.id === draggedNode) continue;

        // Repulsion from other nodes
        for (const other of updatedNodes) {
          if (node.id === other.id) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (dist * dist);
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }

        // Attraction along edges
        for (const edge of edges) {
          let other: GraphNode | undefined;
          if (edge.source === node.id) {
            other = updatedNodes.find((n) => n.id === edge.target);
          } else if (edge.target === node.id) {
            other = updatedNodes.find((n) => n.id === edge.source);
          }
          if (other) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            node.vx += dx * 0.01;
            node.vy += dy * 0.01;
          }
        }

        // Center gravity
        node.vx += (size.width / 2 - node.x) * 0.001;
        node.vy += (size.height / 2 - node.y) * 0.001;

        // Apply velocity with damping
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Bounds
        node.x = Math.max(30, Math.min(size.width - 30, node.x));
        node.y = Math.max(30, Math.min(size.height - 30, node.y));
      }

      nodesRef.current = updatedNodes;
      setNodes(updatedNodes);
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [edges, draggedNode, size]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
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

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNote?.title === node.id;
      const isHovered = hoveredNode === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? 10 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#6b9eff" : isHovered ? "#888" : "#555";
      ctx.fill();

      // Draw label
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.title, node.x, node.y + 22);
    }
  }, [nodes, edges, selectedNote, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      nodesRef.current = nodesRef.current.map((node) =>
        node.id === draggedNode ? { ...node, x, y, vx: 0, vy: 0 } : node
      );
      setNodes(nodesRef.current);
      return;
    }

    // Check hover
    let found = false;
    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < 100) {
        setHoveredNode(node.id);
        found = true;
        break;
      }
    }
    if (!found) setHoveredNode(null);
  };

  const handleMouseDown = () => {
    if (hoveredNode) {
      setDraggedNode(hoveredNode);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleClick = () => {
    if (hoveredNode && !draggedNode) {
      const note = notes.find((n) => n.title === hoveredNode);
      if (note) onSelectNote(note);
    }
  };

  return (
    <div
      ref={containerRef}
      className="graph-view-container"
    >
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className={hoveredNode ? "cursor-pointer" : ""}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}
