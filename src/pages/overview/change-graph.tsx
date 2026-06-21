import React, { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { useAppSelector } from "../../state/store";
import {
  CATEGORY_KIND_LABELS,
  type ChangeCategoryKind,
} from "../../state/slices/settings-slice";
import { KIND_META } from "./kind-meta";
import { KIND_ORDER } from "./use-changes-by-kind";
import { useTheme } from "../../hooks";

// ── Types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: "kind" | "system";
  kind?: ChangeCategoryKind;
  label: string;
  count?: number;
  color: string;
  // runtime fields injected by force-graph
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  kindColor: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const ChangeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { changes } = useAppSelector((state) => state.changes);
  const { categories } = useAppSelector((state) => state.settings);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Measure container on mount and resize
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build graph data
  const { nodes, links, hasData } = useMemo(() => {
    const kindByCategory: Record<string, ChangeCategoryKind> = {};
    categories.forEach((c) => (kindByCategory[c.name] = c.kind));

    // kind → set of touched systems, and count
    const kindSystems: Record<string, Set<string>> = {};
    const kindCount: Record<string, number> = {};
    KIND_ORDER.forEach((k) => {
      kindSystems[k] = new Set();
      kindCount[k] = 0;
    });

    changes
      .filter((c) => !c.id.startsWith("DRAFT"))
      .forEach((c) => {
        const kind = kindByCategory[c.category];
        if (!kind) return;
        const sys = c.systemAffected || "Unassigned";
        kindSystems[kind].add(sys);
        kindCount[kind] = (kindCount[kind] || 0) + 1;
      });

    const systemSet = new Set<string>();
    KIND_ORDER.forEach((k) => kindSystems[k].forEach((s) => systemSet.add(s)));

    const hasData = systemSet.size > 0;

    // Build nodes
    const nodes: GraphNode[] = [
      // Kind nodes
      ...KIND_ORDER.map((kind) => ({
        id: `kind:${kind}`,
        type: "kind" as const,
        kind,
        label: CATEGORY_KIND_LABELS[kind],
        count: kindCount[kind],
        color: KIND_META[kind].color,
      })),
      // System nodes
      ...Array.from(systemSet).map((sys) => ({
        id: `sys:${sys}`,
        type: "system" as const,
        label: sys,
        color: isDarkMode ? "#6b7280" : "#9ca3af",
      })),
    ];

    // Build links
    const links: GraphLink[] = KIND_ORDER.flatMap((kind) =>
      Array.from(kindSystems[kind]).map((sys) => ({
        source: `kind:${kind}`,
        target: `sys:${sys}`,
        kindColor: KIND_META[kind].color,
      })),
    );

    return { nodes, links, hasData };
  }, [changes, categories, isDarkMode]);

  // Neighbour lookup for hover dimming
  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((n) => map.set(n.id, new Set()));
    links.forEach((l) => {
      const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
      const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
      map.get(src)?.add(tgt);
      map.get(tgt)?.add(src);
    });
    return map;
  }, [nodes, links]);

  const isHighlighted = useCallback(
    (id: string) => {
      if (!hoveredId) return true;
      return id === hoveredId || neighbours.get(hoveredId)?.has(id);
    },
    [hoveredId, neighbours],
  );

  // Canvas node painter
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const { x = 0, y = 0, type, color, label, count } = node;
      const highlighted = isHighlighted(node.id);
      const alpha = highlighted ? 1 : 0.15;

      ctx.globalAlpha = alpha;

      if (type === "kind") {
        const r = 28;

        // Outer glow ring
        const grad = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.5);
        grad.addColorStop(0, color + "40");
        grad.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Count text
        ctx.globalAlpha = highlighted ? 1 : 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(count ?? ""), x, y);

        // Label below
        ctx.fillStyle = isDarkMode ? "#e5e5e5" : "#16151c";
        ctx.font = "bold 10px Sora, sans-serif";
        ctx.fillText(label, x, y + r + 13);
      } else {
        // System node — small dot
        const r = 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = isDarkMode ? "#9ca3af" : "#625f70";
        ctx.font = "600 9px Sora, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, x, y + r + 4);
      }

      ctx.globalAlpha = 1;
    },
    [isHighlighted, isDarkMode],
  );

  // Link colour / opacity based on hover
  const linkColor = useCallback(
    (link: GraphLink) => {
      const src = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
      const tgt = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
      if (!hoveredId) return link.kindColor + "66"; // 40% alpha default
      const active = src === hoveredId || tgt === hoveredId || neighbours.get(hoveredId)?.has(src) || neighbours.get(hoveredId)?.has(tgt);
      return active ? link.kindColor + "cc" : link.kindColor + "0d";
    },
    [hoveredId, neighbours],
  );

  const linkWidth = useCallback(
    (link: GraphLink) => {
      if (!hoveredId) return 1.2;
      const src = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
      const tgt = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
      const active = src === hoveredId || tgt === hoveredId;
      return active ? 2.5 : 0.6;
    },
    [hoveredId],
  );

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredId(node?.id ?? null);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "kind") navigate("/changes");
    },
    [navigate],
  );

  const bgColor = isDarkMode ? "#1a1a1a" : "#ffffff";

  return (
    <div className="flex flex-1 flex-col">
      <div className="card flex flex-1 flex-col overflow-hidden">
        {!hasData ? (
          <div className="text-fade-2 flex flex-1 items-center justify-center py-20 text-sm font-medium">
            No submitted requests yet — the graph will appear as changes are
            created across the organization.
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-b border-border-muted px-5 py-3">
              {KIND_ORDER.map((kind) => (
                <div key={kind} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: KIND_META[kind].color }}
                  />
                  <span className="text-fade text-[11px] font-semibold">
                    {CATEGORY_KIND_LABELS[kind]}
                  </span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="bg-fade-2 inline-block h-2.5 w-2.5 rounded-full opacity-60" />
                <span className="text-fade-2 text-[11px] font-semibold">
                  System / Platform
                </span>
              </div>
            </div>

            {/* Graph */}
            <div ref={containerRef} className="flex-1">
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes: nodes as any, links: links as any }}
                backgroundColor={bgColor}
                nodeCanvasObject={paintNode as any}
                nodeCanvasObjectMode={() => "replace"}
                nodePointerAreaPaint={(node: GraphNode, color, ctx) => {
                  const { x = 0, y = 0, type } = node;
                  const r = type === "kind" ? 28 : 8;
                  ctx.beginPath();
                  ctx.arc(x, y, r, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();
                }}
                linkColor={linkColor as any}
                linkWidth={linkWidth as any}
                onNodeHover={handleNodeHover as any}
                onNodeClick={handleNodeClick as any}
                nodeLabel={() => ""}
                cooldownTicks={120}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.004}
                linkDirectionalParticleWidth={(link: GraphLink) =>
                  hoveredId &&
                  (
                    (typeof link.source === "object"
                      ? (link.source as GraphNode).id
                      : link.source) === hoveredId ||
                    (typeof link.target === "object"
                      ? (link.target as GraphNode).id
                      : link.target) === hoveredId
                  )
                    ? 3
                    : 1.5
                }
                linkDirectionalParticleColor={(link: GraphLink) =>
                  link.kindColor
                }
              />
            </div>

            <p className="text-fade-2 border-t border-border-muted px-5 py-2.5 text-center text-[11px]">
              Hover a node to highlight connections · Click a change kind to view all requests
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangeGraph;
