const API_BASE = "/api";

export interface DisassembleRequest {
  target: string;
  rpc_url?: string;
  decimal_counter?: boolean;
}

export interface CfgRequest {
  target: string;
  rpc_url?: string;
  color_edges?: boolean;
}

export interface DecodeRequest {
  target: string;
  rpc_url?: string;
  skip_resolving?: boolean;
}

export interface DecompileRequest {
  target: string;
  rpc_url?: string;
  include_solidity?: boolean;
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const disassemble = (req: DisassembleRequest) =>
  postJson<{ result: string }>("/disassemble", req);

export const cfg = (req: CfgRequest) =>
  postJson<{ dot: string }>("/cfg", req);

export const decode = (req: DecodeRequest) =>
  postJson<{ result: unknown }>("/decode", req);

export const decompile = (req: DecompileRequest) =>
  postJson<{ source: string | null; abi: unknown[] }>("/decompile", req);
