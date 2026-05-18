import "dotenv/config";

export const config = {
  rpc: process.env.OOBE_RPC_URL ?? "https://api.mainnet-beta.solana.com",
  agentKeypair: process.env.AGENT_KEYPAIR ?? "",
  x402PayerKey: process.env.X402_SOLANA_PAYER_KEY ?? "",
  acePlatformToken: process.env.ACE_PLATFORM_TOKEN ?? "",
  cycleIntervalMs: Number(process.env.CYCLE_INTERVAL_MS ?? 120_000),
  maxPairs: Number(process.env.MAX_PAIRS ?? 50),
  maxTradeSizeUsdc: Number(process.env.MAX_TRADE_SIZE_USDC ?? 5),
  minConfidence: Number(process.env.MIN_CONFIDENCE ?? 0.6),
  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;

export function validateConfig(): void {
  const missing: string[] = [];
  if (!config.agentKeypair) missing.push("AGENT_KEYPAIR");
  if (!config.x402PayerKey) missing.push("X402_SOLANA_PAYER_KEY");
  if (!config.acePlatformToken) missing.push("ACE_PLATFORM_TOKEN");
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
