# Heimdall-rs

An advanced, high-performance toolkit for Ethereum Virtual Machine (EVM) smart contract analysis. It extracts information from unverified or "closed-source" smart contracts through bytecode analysis.

## Features

- **Disassemble** - Convert EVM bytecode into human-readable assembly
- **Decompile** - Reconstruct high-level Solidity/Yul-like source code from bytecode
- **CFG** - Generate control flow graphs for contract bytecode
- **Decode** - Parse raw transaction calldata and traces
- **Dump** - Extract state and storage values of a contract
- **Inspect** - Detailed analysis of Ethereum transactions

## Tech Stack

- **Language:** Rust 1.88+ (stable)
- **Build System:** Cargo (workspace with multiple crates)
- **Architecture:** Rust workspace with modular crates under `crates/`

## Project Structure

```
crates/
  cli/        - Main CLI entry point
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
```

## Development

### Build

```bash
cargo build --workspace       # Debug build
cargo build --workspace --release  # Release build
```

### Run

```bash
target/debug/heimdall --help
target/debug/heimdall disassemble <bytecode>
target/debug/heimdall decompile <address> --rpc-url <rpc>
```

## Environment Notes

- Rust toolchain: stable (1.88)
- The `rust-toolchain.toml` has been updated from 1.91.0 to `stable` for Replit compatibility
- The workspace `rust-version` has been updated from 1.91 to 1.88
- System dependency: OpenSSL (installed via Nix)

## Workflow

The "Start application" workflow builds the CLI and displays the help output, confirming the tool is working correctly.
