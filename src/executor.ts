import pino from "pino";
import { config } from "./config.js";
import type { Signal, TradeResult } from "./types.js";

const logger = pino({ level: config.logLevel, name: "executor" });

export async function validateTrade(signal: Signal): Promise<boolean> {
  logger.info({ pair: signal.pair, direction: signal.direction, confidence: signal.confidence }, "Trade validated");
  return signal.confidence >= config.minConfidence;
}

export async function executeSwap(signal: Signal): Promise<TradeResult | null> {
  logger.info({
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    targetPrice: signal.targetPrice,
    stopPrice: signal.stopPrice,
  }, "Trade signal ready — execution would go here with Jupiter");

  return {
    signature: "simulated_tx_signature",
    inputAmount: config.maxTradeSizeUsdc,
    outputAmount: config.maxTradeSizeUsdc / signal.entryPrice,
  };
}

export function rankSignals(signals: Signal[]): Signal[] {
  return signals
    .filter((s) => s.confidence >= config.minConfidence && s.riskScore <= 7)
    .sort((a, b) => b.confidence - a.confidence);
}
