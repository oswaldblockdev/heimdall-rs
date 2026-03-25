import { useMemo } from "react";

interface Instruction {
  pc: string;
  opcode: string;
  mnemonic: string;
  args: string;
}

const OPCODE_COLORS: Record<string, string> = {
  STOP: "text-[#8b949e]",
  RETURN: "text-[#8b949e]",
  REVERT: "text-[#f85149]",
  INVALID: "text-[#f85149]",
  JUMPDEST: "text-[#3fb950]",
  JUMP: "text-[#58a6ff]",
  JUMPI: "text-[#58a6ff]",
  CALL: "text-[#d2a8ff]",
  DELEGATECALL: "text-[#d2a8ff]",
  STATICCALL: "text-[#d2a8ff]",
  CALLCODE: "text-[#d2a8ff]",
  CREATE: "text-[#ffa657]",
  CREATE2: "text-[#ffa657]",
  SLOAD: "text-[#e3b341]",
  SSTORE: "text-[#e3b341]",
  MLOAD: "text-[#79c0ff]",
  MSTORE: "text-[#79c0ff]",
  MSTORE8: "text-[#79c0ff]",
  LOG0: "text-[#ff7b72]",
  LOG1: "text-[#ff7b72]",
  LOG2: "text-[#ff7b72]",
  LOG3: "text-[#ff7b72]",
  LOG4: "text-[#ff7b72]",
};

function getOpcodeCategory(mnemonic: string): string {
  if (["JUMP", "JUMPI", "JUMPDEST"].includes(mnemonic)) return "text-[#58a6ff]";
  if (["STOP", "RETURN", "REVERT", "INVALID", "SELFDESTRUCT"].includes(mnemonic)) return "text-[#f85149]";
  if (mnemonic.startsWith("PUSH")) return "text-[#a5d6ff]";
  if (mnemonic.startsWith("DUP")) return "text-[#6e7681]";
  if (mnemonic.startsWith("SWAP")) return "text-[#6e7681]";
  if (mnemonic.startsWith("LOG")) return "text-[#ff7b72]";
  if (["ADD", "SUB", "MUL", "DIV", "MOD", "EXP", "LT", "GT", "EQ", "AND", "OR", "XOR", "NOT", "SHL", "SHR", "SAR"].includes(mnemonic)) return "text-[#ffa657]";
  if (["MLOAD", "MSTORE", "MSTORE8", "CALLDATALOAD", "CALLDATACOPY", "CALLDATASIZE", "CODECOPY", "CODESIZE", "RETURNDATASIZE", "RETURNDATACOPY"].includes(mnemonic)) return "text-[#79c0ff]";
  if (["SLOAD", "SSTORE"].includes(mnemonic)) return "text-[#e3b341]";
  if (["CALL", "DELEGATECALL", "STATICCALL", "CALLCODE", "CREATE", "CREATE2"].includes(mnemonic)) return "text-[#d2a8ff]";
  return OPCODE_COLORS[mnemonic] || "text-[#e6edf3]";
}

function parseAssembly(asm: string): Instruction[] {
  const lines = asm.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const cleaned = line.trim();
    const pcMatch = cleaned.match(/^(\S+)/);
    const pc = pcMatch ? pcMatch[1] : "";
    const rest = cleaned.slice(pc.length).trim();
    const parts = rest.split(/\s+/);
    const mnemonic = parts[0] || "";
    const args = parts.slice(1).join(" ");
    return { pc, opcode: "", mnemonic, args };
  });
}

export default function DisassembleView({ data }: { data: string }) {
  const instructions = useMemo(() => parseAssembly(data), [data]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ins of instructions) {
      const cat = ins.mnemonic.startsWith("PUSH")
        ? "PUSH"
        : ins.mnemonic.startsWith("DUP")
        ? "DUP"
        : ins.mnemonic.startsWith("SWAP")
        ? "SWAP"
        : ins.mnemonic;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [instructions]);

  const jumpDests = instructions.filter((i) => i.mnemonic === "JUMPDEST").length;
  const pushOps = instructions.filter((i) => i.mnemonic.startsWith("PUSH")).length;
  const controlFlow = instructions.filter((i) => ["JUMP", "JUMPI"].includes(i.mnemonic)).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Instructions", value: instructions.length, color: "text-[#e6edf3]" },
          { label: "JUMPDEST", value: jumpDests, color: "text-[#3fb950]" },
          { label: "PUSH ops", value: pushOps, color: "text-[#a5d6ff]" },
          { label: "Control Flow", value: controlFlow, color: "text-[#58a6ff]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161b22] border border-[#21262d] rounded-md p-3">
            <p className={`text-2xl font-mono font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[#8b949e] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top opcodes */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-md p-3">
        <p className="text-[#8b949e] text-xs font-medium uppercase tracking-widest mb-2">Top Opcodes</p>
        <div className="flex flex-wrap gap-2">
          {stats.map(([op, count]) => (
            <span
              key={op}
              className={`text-xs font-mono px-2 py-0.5 rounded-full bg-[#0d1117] border border-[#30363d] ${getOpcodeCategory(op)}`}
            >
              {op} <span className="text-[#6e7681]">×{count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Instruction table */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-md overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-420px)]">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="text-left px-4 py-2 text-[#8b949e] font-medium w-24">PC</th>
                <th className="text-left px-4 py-2 text-[#8b949e] font-medium w-36">Mnemonic</th>
                <th className="text-left px-4 py-2 text-[#8b949e] font-medium">Arguments</th>
              </tr>
            </thead>
            <tbody>
              {instructions.map((ins, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#0d1117] hover:bg-[#1c2128] transition-colors ${
                    ins.mnemonic === "JUMPDEST" ? "bg-[#0d2118]" : ""
                  }`}
                >
                  <td className="px-4 py-1.5 text-[#6e7681]">{ins.pc}</td>
                  <td className={`px-4 py-1.5 font-semibold ${getOpcodeCategory(ins.mnemonic)}`}>
                    {ins.mnemonic}
                  </td>
                  <td className="px-4 py-1.5 text-[#a5d6ff] break-all">{ins.args}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
