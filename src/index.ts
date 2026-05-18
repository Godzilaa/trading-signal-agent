import pino from "pino";
import { config, validateConfig } from "./config.js";
import { registerAgent } from "./sap-agent.js";
import { fetchTopPairs } from "./data-fetcher.js";
import { analyzeBatch } from "./ai-engine.js";
import { validateTrade, executeSwap, rankSignals } from "./executor.js";
import { storeSignals, storeTrade, getStats } from "./memory.js";

const logger = pino({ level: config.logLevel, name: "trading-agent" });

async function cycle(cycleNum: number): Promise<void> {
  const start = Date.now();
  logger.info({ cycle: cycleNum }, "Starting cycle");

  const pairs = await fetchTopPairs();
  if (pairs.length === 0) {
    logger.warn("No market data, skipping");
    return;
  }

  const signals = await analyzeBatch(pairs);
  await storeSignals(signals);

  const ranked = rankSignals(signals);
  const best = ranked[0];
  if (!best) {
    logger.info("No actionable signals");
    return;
  }

  if (!await validateTrade(best)) {
    logger.info("Trade validation failed");
    return;
  }

  const result = await executeSwap(best);
  if (!result) {
    logger.warn("Swap failed");
    return;
  }

  await storeTrade(best, result);

  const elapsed = Date.now() - start;
  const stats = getStats();
  logger.info({ cycle: cycleNum, elapsedMs: elapsed, stats }, "Cycle complete");
}

async function main(): Promise<void> {
  validateConfig();
  logger.info("Starting Trading Signal Agent");

  try {
    await registerAgent();
  } catch (error) {
    logger.warn({ error }, "SAP registration skipped (agent may already exist or network unavailable)");
  }

  let cycleNum = 0;
  while (true) {
    try {
      await cycle(++cycleNum);
    } catch (error) {
      logger.error({ error }, "Cycle failed");
    }

    const stats = getStats();
    logger.info({ cycles: stats.cycles, signals: stats.signals, trades: stats.trades, winRate: `${stats.winRate}%` }, "Health");

    await new Promise((resolve) => setTimeout(resolve, config.cycleIntervalMs));
  }
}

main().catch((error) => {
  logger.fatal({ error }, "Agent crashed");
  process.exit(1);
});
