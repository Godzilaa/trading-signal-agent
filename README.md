# Trading Signal Agent

Autonomous on-chain agent for Solana that discovers market data tools via Synapse Agent Protocol (SAP), analyzes token pairs using Ace Data Cloud AI APIs (paid per-call via x402), generates trading signals, and executes trades through Jupiter.

Built for the OOBE Protocol × Ace Data Cloud bounty.

## Architecture

```
Agent Loop (every 120s):
  SAP Discovery → Market Data → AI Analysis (x402) → Signal Ranking → Trade Execution → On-Chain Storage
```

## Prerequisites

- Node.js 22+
- Solana wallet with USDC (for x402 payments) + small SOL (gas)
- Ace Data Cloud account + platform token

## Setup

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your keys:
#   AGENT_KEYPAIR         — Solana keypair (base58) for SAP registration
#   X402_SOLANA_PAYER_KEY — Solana keypair with USDC for x402 payments
#   ACE_PLATFORM_TOKEN    — Ace Data Cloud API token

# Run
npm run dev
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AGENT_KEYPAIR` | Yes | — | Solana keypair for SAP on-chain identity |
| `X402_SOLANA_PAYER_KEY` | Yes | — | Wallet with USDC for x402 micropayments |
| `ACE_PLATFORM_TOKEN` | Yes | — | Ace Data Cloud API token |
| `OOBE_RPC_URL` | No | OOBE mainnet | Solana RPC endpoint |
| `CYCLE_INTERVAL_MS` | No | 120000 | Loop interval in ms |
| `MAX_PAIRS` | No | 50 | Token pairs to analyze per cycle |
| `MAX_TRADE_SIZE_USDC` | No | 5 | Max USDC per trade |
| `MIN_CONFIDENCE` | No | 0.6 | Minimum signal confidence to trade |
| `STOP_LOSS_BPS` | No | 500 | Stop loss in basis points |

## How It Works

1. **SAP Registration**: Agent creates an on-chain identity via Synapse Agent Protocol with capabilities `market-analysis` and `trading-signals`.

2. **Market Data**: Fetches real-time prices for top Solana tokens via Jupiter (built into Synapse SDK).

3. **AI Analysis**: Each token pair is analyzed by GPT-4o-mini through Ace Data Cloud. Each API call is paid via the x402 protocol (HTTP 402 → sign USDC → retry → result).

4. **Signal Ranking**: Signals are filtered by confidence threshold and ranked by expected return.

5. **Trade Execution**: Top signal is validated by AI, then executed via Jupiter swap.

6. **On-Chain Storage**: Signals and trade history are stored via SAP MemoryLedger.

## Deployment

```bash
# Build
npm run build

# Docker
docker build -t trading-signal-agent .
docker run --env-file .env trading-signal-agent
```

## Project Structure

```
src/
  config.ts       — Environment configuration + validation
  types.ts        — Shared types (Signal, PairData, TradeResult)
  sap-agent.ts    — SAP registration + tool discovery
  data-fetcher.ts — Market data from Jupiter/Raydium/Orca
  ai-engine.ts    — Ace Data Cloud AI analysis (x402 paid)
  executor.ts     — Trade validation + Jupiter swap execution
  memory.ts       — In-memory signal/trade history
  index.ts        — Main loop orchestration
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| On-chain Protocol | Synapse Agent Protocol (SAP) |
| AI APIs | Ace Data Cloud (GPT-4o-mini) |
| Payments | x402 (Solana USDC) |
| DEX | Jupiter |
| Market Data | Synapse SDK DeFi plugin |
| Storage | SAP MemoryLedger |

## License

MIT
