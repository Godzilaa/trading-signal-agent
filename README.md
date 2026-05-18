# Trading Signal Agent

Autonomous on-chain agent for Solana that discovers market data tools via Synapse Agent Protocol (SAP), analyzes token pairs using Ace Data Cloud AI APIs (paid per-call via x402), generates trading signals, and executes trades through Jupiter.

Built for the OOBE Protocol × Ace Data Cloud bounty.

## Problem

Crypto traders are drowning in data — price feeds, news, on-chain metrics, social sentiment. No human can watch 10+ tokens across all these sources 24/7 and make consistent, disciplined trading decisions without emotional bias. Existing bots are opaque: they trade with hardcoded rules, don't explain their reasoning, and can't adapt to new market conditions.

## Solution

An **autonomous AI agent** that runs 24/7 with zero human intervention. Every 2 minutes it:

1. **Registers itself on-chain** via SAP so other protocols and users can discover it
2. **Fetches live prices** for top Solana tokens from Jupiter
3. **Searches real-time news & sentiment** for each token using the Ace Data Cloud Search API
4. **Analyzes every token with GPT-4o-mini** through Ace Data Cloud Chat Completions — combining price data, volume, 24h change, cross-market context, and live news into a structured trading signal
5. **Ranks and filters signals** by confidence and risk, picks the best opportunity
6. **Logs every decision** — price context, AI reasoning, confidence score, trade result

Each signal is a transparent, readable JSON explanation: *why* this token, *what* the AI sees, *how* confident it is. No black box, no hardcoded rules, no emotional trading.

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
