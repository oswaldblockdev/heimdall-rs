import { useState } from "react";
import DisassembleView from "./components/DisassembleView";
import CfgView from "./components/CfgView";
import DecodeView from "./components/DecodeView";
import DecompileView from "./components/DecompileView";
import * as api from "./api";

type Tool = "disassemble" | "cfg" | "decode" | "decompile";

const TOOLS: { id: Tool; label: string; icon: string; description: string }[] = [
  { id: "disassemble", label: "Disassemble", icon: "⚙", description: "Convert bytecode to EVM assembly opcodes" },
  { id: "decompile", label: "Decompile", icon: "◈", description: "Reconstruct Solidity/Yul source from bytecode" },
  { id: "cfg", label: "Control Flow", icon: "⬡", description: "Visualize execution flow as a graph" },
  { id: "decode", label: "Decode", icon: "⊞", description: "Decode calldata or transaction input" },
];

const EXAMPLES: Record<Tool, { target: string; label: string; needsRpc: boolean }> = {
  disassemble: {
    target: "0x6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063771602f71460415780638aa6ccb914606357806399a88f1814608557600080fd5b600080fd5b604d6040366004608e565b6051565b604051908152602001604051565b605b6062366004608e565b0190565b6040519015158152602001604051565b6080606e366004608e565b8192919060015b509050565b60008060408385031215609f57600080fd5b5080359160200135905056fea264697066735822122064e7a0b9bb5c9af001c6f0c9c282e3d46b30f3dfe66a20a5dd8e83f5baa6c22d64736f6c634300080e0033",
    label: "Example bytecode",
    needsRpc: false,
  },
  decompile: {
    target: "0x6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063771602f71460415780638aa6ccb914606357806399a88f1814608557600080fd5b600080fd5b604d6040366004608e565b6051565b604051908152602001604051565b605b6062366004608e565b0190565b6040519015158152602001604051565b6080606e366004608e565b8192919060015b509050565b60008060408385031215609f57600080fd5b5080359160200135905056fea264697066735822122064e7a0b9bb5c9af001c6f0c9c282e3d46b30f3dfe66a20a5dd8e83f5baa6c22d64736f6c634300080e0033",
    label: "Example bytecode",
    needsRpc: false,
  },
  cfg: {
    target: "0x6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063771602f71460415780638aa6ccb914606357806399a88f1814608557600080fd5b600080fd5b604d6040366004608e565b6051565b604051908152602001604051565b605b6062366004608e565b0190565b6040519015158152602001604051565b6080606e366004608e565b8192919060015b509050565b60008060408385031215609f57600080fd5b5080359160200135905056fea264697066735822122064e7a0b9bb5c9af001c6f0c9c282e3d46b30f3dfe66a20a5dd8e83f5baa6c22d64736f6c634300080e0033",
    label: "Example bytecode",
    needsRpc: false,
  },
  decode: {
    target: "0xa9059cbb000000000000000000000000d3cda913deb6f0967967fa749c95c28e25e38df0000000000000000000000000000000000000000000000001bc16d674ec80000",
    label: "ERC-20 transfer",
    needsRpc: false,
  },
};

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>("disassemble");
  const [target, setTarget] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [resultTool, setResultTool] = useState<Tool | null>(null);

  const handleExample = () => {
    const ex = EXAMPLES[activeTool];
    setTarget(ex.target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setResultTool(null);
    try {
      let res: unknown;
      const req = { target: target.trim(), rpc_url: rpcUrl.trim() || undefined };
      if (activeTool === "disassemble") res = await api.disassemble(req);
      else if (activeTool === "cfg") res = await api.cfg(req);
      else if (activeTool === "decode") res = await api.decode(req);
      else res = await api.decompile(req);
      setResult(res);
      setResultTool(activeTool);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const currentTool = TOOLS.find((t) => t.id === activeTool)!;

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#21262d] px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-sm font-bold text-white">
            ⌀
          </div>
          <div>
            <h1 className="text-[#e6edf3] font-semibold text-lg leading-tight">Heimdall</h1>
            <p className="text-[#8b949e] text-xs">EVM Smart Contract Analysis</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-[#8b949e]">
          <span className="w-2 h-2 rounded-full bg-[#3fb950] inline-block"></span>
          API Ready
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#21262d] flex flex-col bg-[#0d1117]">
          <div className="p-4">
            <p className="text-[#8b949e] text-xs font-medium uppercase tracking-widest mb-3">Tools</p>
            <nav className="space-y-1">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool.id); setResult(null); setError(null); }}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-start gap-3 ${
                    activeTool === tool.id
                      ? "bg-[#1f6feb] text-white"
                      : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
                  }`}
                >
                  <span className="text-base mt-0.5 shrink-0">{tool.icon}</span>
                  <div>
                    <div className="font-medium">{tool.label}</div>
                    <div className={`text-xs mt-0.5 ${activeTool === tool.id ? "text-[#cae8ff]" : "text-[#6e7681]"}`}>
                      {tool.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-[#21262d] mt-auto">
            <div className="rounded-md bg-[#161b22] border border-[#21262d] p-3 text-xs text-[#8b949e] space-y-1">
              <p className="text-[#58a6ff] font-medium">Accepted inputs</p>
              <p>• Hex bytecode (0x...)</p>
              <p>• Contract address + RPC URL</p>
              <p>• Transaction hash + RPC URL</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-b border-[#21262d] p-4 bg-[#0d1117]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{currentTool.icon}</span>
              <h2 className="text-[#e6edf3] font-semibold">{currentTool.label}</h2>
              <span className="text-[#8b949e] text-sm">— {currentTool.description}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <textarea
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={
                    activeTool === "decode"
                      ? "0xa9059cbb... (calldata or tx hash)"
                      : "0x6080... (bytecode) or 0x... (contract address)"
                  }
                  rows={2}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-none"
                />
              </div>
              <div className="w-64">
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  placeholder="RPC URL (for addresses/tx hashes)"
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                disabled={loading || !target.trim()}
                className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] text-white text-sm font-medium rounded-md transition-colors"
              >
                {loading ? "Analyzing…" : "Analyze"}
              </button>
              <button
                type="button"
                onClick={handleExample}
                className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] text-sm rounded-md transition-colors border border-[#30363d]"
              >
                Load Example
              </button>
              {(result || error) && (
                <button
                  type="button"
                  onClick={() => { setResult(null); setError(null); }}
                  className="px-4 py-1.5 text-[#8b949e] hover:text-[#e6edf3] text-sm transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Results */}
          <div className="flex-1 overflow-auto p-4">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#8b949e]">Analyzing bytecode…</p>
                  <p className="text-[#6e7681] text-sm mt-1">This may take a moment</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-[#f85149] bg-[#1c1c1c] p-4">
                <p className="text-[#f85149] font-medium mb-1">Analysis failed</p>
                <p className="text-[#8b949e] text-sm font-mono">{error}</p>
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-6xl mb-4 opacity-20">{currentTool.icon}</div>
                  <p className="text-[#8b949e] text-lg">Enter a target above to start analysis</p>
                  <p className="text-[#6e7681] text-sm mt-2">
                    Use "Load Example" to see a sample result
                  </p>
                </div>
              </div>
            )}

            {result && resultTool === "disassemble" && (
              <DisassembleView data={(result as { result: string }).result} />
            )}
            {result && resultTool === "cfg" && (
              <CfgView dot={(result as { dot: string }).dot} />
            )}
            {result && resultTool === "decode" && (
              <DecodeView data={(result as { result: unknown }).result} />
            )}
            {result && resultTool === "decompile" && (
              <DecompileView
                source={(result as { source: string | null; abi: unknown[] }).source}
                abi={(result as { source: string | null; abi: unknown[] }).abi}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
