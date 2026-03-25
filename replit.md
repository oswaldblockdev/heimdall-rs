# Heimdall-rs

An advanced, high-performance toolkit for Ethereum Virtual Machine (EVM) smart contract analysis with a web frontend for interactive exploration.

## Features

- **Disassemble** - Convert EVM bytecode into syntax-highlighted opcode table with stats
- **Decompile** - Reconstruct Solidity/Yul source code with ABI recovery and syntax highlighting
- **Control Flow** - Generate and visualize CFG as an interactive graph (powered by Graphviz/viz.js)
- **Decode** - Parse calldata or transaction input into readable function signatures and parameters

## Architecture

### Frontend (`frontend/`)
- React + Vite + TypeScript on port **5000**
- Tailwind CSS dark theme
- `@viz-js/viz` for Graphviz DOT rendering (CFG visualization)
- Proxies `/api/*` to the Rust backend on port 3001

### Backend (`crates/server/`)
- Rust axum web server on port **3001** (localhost)
- Calls heimdall library crates directly (no CLI shelling)
- Endpoints:
  - `POST /api/disassemble` — bytecode → assembly
  - `POST /api/cfg` — bytecode → DOT graph
  - `POST /api/decode` — calldata → decoded params
  - `POST /api/decompile` — bytecode → Solidity source + ABI

### CLI (`crates/cli/`)
- Original command-line interface (unchanged)

## Tech Stack

- **Language:** Rust 1.88+ (stable), TypeScript/React
- **Build System:** Cargo (workspace), npm (frontend)
- **Web Framework:** axum 0.7
- **Frontend:** Vite 5, React 18, Tailwind CSS 3

## Project Structure

```
crates/
  server/     - Axum REST API server (new)
  cli/        - Original CLI entry point
  core/       - High-level orchestration
  vm/         - Custom EVM implementation
  common/     - Shared utilities and types
  cfg/        - Control flow graph generation
  decode/     - Calldata/trace decoding
  decompile/  - Bytecode decompilation
  disassemble/ - Bytecode disassembly
  dump/       - Storage dumping
  inspect/    - Transaction inspection
  cache/      - Caching infrastructure
  config/     - Configuration management
  tracing/    - Logging/tracing infrastructure
frontend/
  src/
    App.tsx                 - Main app layout and routing
    api/index.ts            - API client functions
    components/
      DisassembleView.tsx   - Opcode table with syntax highlighting
      CfgView.tsx           - Interactive DOT graph viewer
      DecodeView.tsx        - Calldata JSON tree viewer
      DecompileView.tsx     - Source + ABI tab viewer
```

## Development

### Build backend

```bash
cargo build --workspace
```

### Run backend

```bash
target/debug/heimdall-server  # API on port 3001
target/debug/heimdall --help  # CLI
```

### Run frontend

```bash
cd frontend && npm run dev  # Vite dev server on port 5000
```

## Workflows

- **Start application** — Vite frontend dev server (port 5000, webview)
- **API Server** — Rust axum backend (port 3001, console)

## Environment Notes

- Rust toolchain: stable (1.88), updated from 1.91 requirement
- OpenSSL installed via Nix for TLS support
