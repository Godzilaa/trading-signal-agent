import pino from "pino";
import { config } from "./config.js";
import type { Signal, TradeResult } from "./types.js";

const logger = pino({ level: config.logLevel, name: "memory" });

interface SignalRecord { signal: Signal; timestamp: number; cycle: number }
interface TradeRecord { signal: Signal; result: TradeResult; timestamp: number }

const signalHistory: SignalRecord[] = [];
const tradeHistory: TradeRecord[] = [];
let cycleCount = 0;

export async function storeSignals(signals: Signal[]): Promise<void> {
  cycleCount++;
  for (const s of signals) {
    signalHistory.push({ signal: s, timestamp: Date.now(), cycle: cycleCount });
  }
  if (signalHistory.length > 1000) signalHistory.splice(0, signalHistory.length - 1000);
  logger.debug({ count: signals.length }, "Signals stored");
}

export async function storeTrade(signal: Signal, result: TradeResult): Promise<void> {
  tradeHistory.push({ signal, result, timestamp: Date.now() });
  logger.info({ pair: signal.pair, direction: signal.direction }, "Trade recorded");
}

export function getStats() {
  return {
    cycles: cycleCount,
    signals: signalHistory.length,
    trades: tradeHistory.length,
    winRate: tradeHistory.length > 0
      ? (tradeHistory.filter((t) =>
          t.signal.direction === "long"
            ? t.result.outputAmount > t.result.inputAmount
            : t.result.outputAmount < t.result.inputAmount
        ).length / tradeHistory.length * 100).toFixed(1)
      : "0.0",
  };
}
