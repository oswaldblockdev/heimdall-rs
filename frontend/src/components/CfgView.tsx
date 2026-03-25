import { useEffect, useRef, useState } from "react";

export default function CfgView({ dot }: { dot: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [renderMode, setRenderMode] = useState<"graph" | "dot">("graph");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { instance } = await import("@viz-js/viz");
        const viz = await instance();
        const rendered = viz.renderSVGElement(dot);
        if (!cancelled) {
          // Style the SVG
          rendered.setAttribute("width", "100%");
          rendered.setAttribute("height", "100%");
          rendered.style.background = "transparent";
          // Color the nodes and edges
          const nodes = rendered.querySelectorAll(".node polygon, .node ellipse, .node rect");
          nodes.forEach((el) => {
            (el as SVGElement).style.fill = "#161b22";
            (el as SVGElement).style.stroke = "#30363d";
          });
          const nodeTexts = rendered.querySelectorAll(".node text");
          nodeTexts.forEach((el) => {
            (el as SVGElement).style.fill = "#e6edf3";
            (el as SVGElement).style.fontFamily = "JetBrains Mono, monospace";
            (el as SVGElement).style.fontSize = "10px";
          });
          const edges = rendered.querySelectorAll(".edge path");
          edges.forEach((el) => {
            if (!(el as SVGPathElement).getAttribute("stroke")?.includes("red") &&
                !(el as SVGPathElement).getAttribute("stroke")?.includes("green")) {
              (el as SVGElement).style.stroke = "#58a6ff";
            }
          });
          const arrowheads = rendered.querySelectorAll(".edge polygon");
          arrowheads.forEach((el) => {
            if (!(el as SVGPolygonElement).getAttribute("stroke")?.includes("red") &&
                !(el as SVGPolygonElement).getAttribute("stroke")?.includes("green")) {
              (el as SVGElement).style.fill = "#58a6ff";
              (el as SVGElement).style.stroke = "#58a6ff";
            }
          });
          setSvg(rendered.outerHTML);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render graph");
          setRenderMode("dot");
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [dot]);

  const blockCount = (dot.match(/label=/g) || []).length;
  const edgeCount = (dot.match(/->/g) || []).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Basic Blocks", value: blockCount, color: "text-[#e6edf3]" },
          { label: "Edges", value: edgeCount, color: "text-[#58a6ff]" },
          { label: "Format", value: "DOT", color: "text-[#3fb950]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161b22] border border-[#21262d] rounded-md p-3">
            <p className={`text-2xl font-mono font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[#8b949e] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-[#30363d] overflow-hidden">
          {(["graph", "dot"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                renderMode === mode
                  ? "bg-[#1f6feb] text-white"
                  : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              {mode === "graph" ? "Graph View" : "DOT Source"}
            </button>
          ))}
        </div>
        {renderMode === "graph" && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-[#8b949e] text-xs">Zoom</span>
            <input
              type="range"
              min="0.3"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-[#8b949e] text-xs font-mono">{Math.round(scale * 100)}%</span>
          </div>
        )}
      </div>

      {/* Graph or DOT */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-md overflow-hidden">
        {renderMode === "graph" ? (
          <div
            ref={containerRef}
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 420px)", minHeight: "300px" }}
          >
            {error && (
              <div className="p-4 text-[#f85149] text-sm">
                Graph render failed: {error}. Showing DOT source instead.
              </div>
            )}
            {svg ? (
              <div
                style={{ transform: `scale(${scale})`, transformOrigin: "top left", padding: "16px" }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : !error ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-[#8b949e] flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
                  Rendering graph…
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 420px)" }}>
            <pre className="p-4 text-xs font-mono text-[#e6edf3] whitespace-pre-wrap">{dot}</pre>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#8b949e]">
        <span className="font-medium text-[#6e7681]">Edge colors:</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-[#3fb950] inline-block"></span> JUMPI true branch
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-[#f85149] inline-block"></span> JUMPI false branch
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-[#58a6ff] inline-block"></span> Unconditional
        </span>
      </div>
    </div>
  );
}
