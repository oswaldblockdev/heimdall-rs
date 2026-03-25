interface JsonNodeProps {
  value: unknown;
  depth?: number;
}

function JsonNode({ value, depth = 0 }: JsonNodeProps) {
  const indent = depth * 16;

  if (value === null) return <span className="text-[#8b949e]">null</span>;
  if (typeof value === "boolean")
    return <span className="text-[#79c0ff]">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-[#ffa657]">{value}</span>;
  if (typeof value === "string")
    return <span className="text-[#a5d6ff]">"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[#8b949e]">[]</span>;
    return (
      <span>
        <span className="text-[#e6edf3]">[</span>
        {value.map((v, i) => (
          <div key={i} style={{ paddingLeft: indent + 16 }}>
            <JsonNode value={v} depth={depth + 1} />
            {i < value.length - 1 && <span className="text-[#8b949e]">,</span>}
          </div>
        ))}
        <span style={{ paddingLeft: indent }} className="text-[#e6edf3] block">]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-[#8b949e]">{"{}"}</span>;
    return (
      <span>
        <span className="text-[#e6edf3]">{"{"}</span>
        {entries.map(([k, v], i) => (
          <div key={k} style={{ paddingLeft: indent + 16 }}>
            <span className="text-[#e3b341]">"{k}"</span>
            <span className="text-[#e6edf3]">: </span>
            <JsonNode value={v} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-[#8b949e]">,</span>}
          </div>
        ))}
        <span style={{ paddingLeft: indent }} className="text-[#e6edf3] block">{"}"}</span>
      </span>
    );
  }

  return <span className="text-[#e6edf3]">{String(value)}</span>;
}

function extractFunctionInfo(data: unknown): { name?: string; selector?: string; inputs?: unknown[] } {
  if (!data || typeof data !== "object") return {};
  const d = data as Record<string, unknown>;
  const decoded = d.decoded as Record<string, unknown> | undefined;
  if (!decoded) return {};
  return {
    name: decoded.name as string | undefined,
    selector: decoded.selector as string | undefined,
    inputs: decoded.inputs as unknown[] | undefined,
  };
}

export default function DecodeView({ data }: { data: unknown }) {
  const info = extractFunctionInfo(data);

  return (
    <div className="space-y-4">
      {/* Function signature highlight */}
      {info.name && (
        <div className="bg-[#0d2118] border border-[#238636] rounded-md p-4">
          <p className="text-[#3fb950] text-xs font-medium uppercase tracking-widest mb-2">
            Decoded Function
          </p>
          <div className="font-mono">
            <span className="text-[#d2a8ff] text-lg font-semibold">{info.name}</span>
            {info.selector && (
              <span className="ml-3 text-xs text-[#8b949e] bg-[#161b22] px-2 py-0.5 rounded font-mono border border-[#21262d]">
                {info.selector}
              </span>
            )}
          </div>
          {info.inputs && Array.isArray(info.inputs) && info.inputs.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-[#8b949e] text-xs mb-2">Parameters</p>
              {(info.inputs as Record<string, unknown>[]).map((inp, i) => (
                <div key={i} className="flex items-start gap-3 text-sm font-mono">
                  <span className="text-[#6e7681] w-6 shrink-0 text-right">{i}</span>
                  <span className="text-[#ffa657]">{String(inp.type || "")}</span>
                  {inp.name && <span className="text-[#e6edf3]">{String(inp.name)}</span>}
                  <span className="text-[#a5d6ff] break-all">{String(inp.value ?? "")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw JSON tree */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-md p-4">
        <p className="text-[#8b949e] text-xs font-medium uppercase tracking-widest mb-3">Full Result</p>
        <div
          className="font-mono text-sm overflow-auto"
          style={{ maxHeight: "calc(100vh - 450px)" }}
        >
          <JsonNode value={data} />
        </div>
      </div>
    </div>
  );
}
