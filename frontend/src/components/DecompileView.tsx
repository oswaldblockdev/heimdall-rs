import { useState } from "react";

function highlightSolidity(code: string): string {
  const keywords = [
    "function", "returns", "return", "if", "else", "for", "while", "do",
    "mapping", "struct", "event", "modifier", "require", "revert", "emit",
    "uint256", "uint128", "uint64", "uint32", "uint16", "uint8", "uint",
    "int256", "int128", "int64", "int32", "int16", "int8", "int",
    "address", "bool", "bytes", "bytes32", "bytes4", "bytes1", "string",
    "public", "private", "internal", "external", "view", "pure", "payable",
    "memory", "storage", "calldata", "immutable", "constant",
    "contract", "interface", "library", "pragma", "import", "is",
    "new", "delete", "true", "false", "this", "msg", "block", "tx",
  ];

  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Comments
  highlighted = highlighted.replace(
    /(\/\/[^\n]*)/g,
    '<span style="color:#8b949e;font-style:italic">$1</span>'
  );

  // Strings
  highlighted = highlighted.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    '<span style="color:#a5d6ff">$1</span>'
  );

  // Numbers (hex and decimal)
  highlighted = highlighted.replace(
    /\b(0x[0-9a-fA-F]+|\d+)\b/g,
    '<span style="color:#ffa657">$1</span>'
  );

  // Keywords
  const kwRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  highlighted = highlighted.replace(
    kwRegex,
    '<span style="color:#d2a8ff">$1</span>'
  );

  // Function names (word followed by open paren)
  highlighted = highlighted.replace(
    /\b([a-zA-Z_]\w*)\s*\(/g,
    '<span style="color:#58a6ff">$1</span>('
  );

  return highlighted;
}

interface AbiEntry {
  name?: string;
  type?: string;
  inputs?: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: string;
}

export default function DecompileView({
  source,
  abi,
}: {
  source: string | null;
  abi: unknown[];
}) {
  const [activeTab, setActiveTab] = useState<"source" | "abi">("source");

  const abiEntries = (abi as AbiEntry[]) || [];
  const functions = abiEntries.filter((e) => e.type === "function" || !e.type);
  const events = abiEntries.filter((e) => e.type === "event");

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#21262d] pb-1">
        {(["source", "abi"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-t-md transition-colors ${
              activeTab === tab
                ? "text-[#e6edf3] border-b-2 border-[#58a6ff]"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            {tab === "source" ? "Source Code" : `ABI (${abiEntries.length})`}
          </button>
        ))}
        {source && (
          <span className="ml-auto text-xs text-[#8b949e]">
            {source.split("\n").length} lines
          </span>
        )}
      </div>

      {activeTab === "source" && (
        <div className="bg-[#161b22] border border-[#21262d] rounded-md overflow-hidden">
          {source ? (
            <div
              className="overflow-auto"
              style={{ maxHeight: "calc(100vh - 380px)" }}
            >
              <table className="w-full text-xs font-mono">
                <tbody>
                  {source.split("\n").map((line, i) => (
                    <tr key={i} className="hover:bg-[#1c2128]">
                      <td className="px-3 py-0.5 text-[#6e7681] text-right select-none w-10 border-r border-[#21262d]">
                        {i + 1}
                      </td>
                      <td
                        className="px-4 py-0.5 text-[#e6edf3] whitespace-pre"
                        dangerouslySetInnerHTML={{
                          __html: highlightSolidity(line),
                        }}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[#8b949e]">
              <p>No source code generated.</p>
              <p className="text-sm mt-1 text-[#6e7681]">
                Check the ABI tab for recovered function signatures.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "abi" && (
        <div className="space-y-3">
          {functions.length > 0 && (
            <div className="bg-[#161b22] border border-[#21262d] rounded-md overflow-hidden">
              <div className="px-4 py-2 border-b border-[#21262d] flex items-center gap-2">
                <span className="text-[#3fb950] text-xs font-medium uppercase tracking-widest">
                  Functions
                </span>
                <span className="text-[#6e7681] text-xs bg-[#0d1117] px-1.5 py-0.5 rounded-full border border-[#21262d]">
                  {functions.length}
                </span>
              </div>
              <div
                className="overflow-auto"
                style={{ maxHeight: "300px" }}
              >
                <table className="w-full text-xs font-mono">
                  <thead className="bg-[#0d1117]">
                    <tr>
                      <th className="px-4 py-2 text-left text-[#8b949e]">Name</th>
                      <th className="px-4 py-2 text-left text-[#8b949e]">Inputs</th>
                      <th className="px-4 py-2 text-left text-[#8b949e]">Outputs</th>
                      <th className="px-4 py-2 text-left text-[#8b949e]">Mutability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {functions.map((fn, i) => (
                      <tr key={i} className="border-t border-[#0d1117] hover:bg-[#1c2128]">
                        <td className="px-4 py-2 text-[#58a6ff] font-semibold">
                          {fn.name || "(fallback)"}
                        </td>
                        <td className="px-4 py-2 text-[#e6edf3]">
                          {fn.inputs
                            ?.map((inp) => `${inp.type}${inp.name ? " " + inp.name : ""}`)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-[#a5d6ff]">
                          {fn.outputs
                            ?.map((out) => out.type)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              fn.stateMutability === "view"
                                ? "bg-[#0d2118] text-[#3fb950] border border-[#238636]"
                                : fn.stateMutability === "payable"
                                ? "bg-[#271b00] text-[#ffa657] border border-[#9e6a03]"
                                : fn.stateMutability === "pure"
                                ? "bg-[#0c1a2e] text-[#58a6ff] border border-[#1f6feb]"
                                : "bg-[#21262d] text-[#8b949e] border border-[#30363d]"
                            }`}
                          >
                            {fn.stateMutability || "nonpayable"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="bg-[#161b22] border border-[#21262d] rounded-md overflow-hidden">
              <div className="px-4 py-2 border-b border-[#21262d]">
                <span className="text-[#ffa657] text-xs font-medium uppercase tracking-widest">
                  Events ({events.length})
                </span>
              </div>
              <div className="p-3 space-y-1">
                {events.map((ev, i) => (
                  <div key={i} className="font-mono text-xs text-[#e6edf3]">
                    <span className="text-[#ffa657]">event</span>{" "}
                    <span className="text-[#e3b341]">{ev.name}</span>
                    <span className="text-[#8b949e]">
                      ({ev.inputs?.map((inp) => `${inp.type}${inp.name ? " " + inp.name : ""}`).join(", ")})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {abiEntries.length === 0 && (
            <div className="bg-[#161b22] border border-[#21262d] rounded-md p-8 text-center text-[#8b949e]">
              No ABI entries recovered.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
