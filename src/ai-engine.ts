import pino from "pino";
import { AceDataCloud } from "@acedatacloud/sdk";
import { config } from "./config.js";
import { SignalSchema, type TokenInfo, type Signal } from "./types.js";

const logger = pino({ level: config.logLevel, name: "ai-engine" });

const aceClient = new AceDataCloud({
  apiToken: config.acePlatformToken,
});

const API_BASE = "https://api.acedata.cloud";
const SYSTEM_PROMPT = `You are a crypto trading analyst. Analyze the provided market data and return ONLY a JSON object (no markdown, no backticks):
{
  "pair": "SOL/USDC",
  "direction": "long" or "short",
  "confidence": 0.0-1.0,
  "entryPrice": number,
  "targetPrice": number,
  "stopPrice": number,
  "reasoning": "brief explanation",
  "riskScore": 1-10
}`;

async function callAceAI(messages: { role: string; content: string }[]): Promise<string | null> {
    const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.acePlatformToken}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
    }),
  });

  if (res.status === 402) {
    const body = await res.json() as { accepts?: Array<{ network: string; maxAmountRequired: string; payTo: string; asset: string }> };
    logger.warn({ body }, "x402 payment required — fund your wallet with USDC");
    return null;
  }

  if (!res.ok) {
    logger.error({ status: res.status, body: await res.text() }, "Ace API error");
    return null;
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? null;
}

interface SearchResult {
  title: string;
  snippet: string;
  link?: string;
}

async function searchTokenNews(symbol: string): Promise<string> {
  try {
    const raw = await aceClient.search.google({
      query: `${symbol} cryptocurrency news sentiment analysis 2026`,
      language: "en",
      page: 1,
    });
    const results = (raw as { organic_results?: SearchResult[] }).organic_results;
    if (!results || results.length === 0) return "";

    const snippets = results.slice(0, 4).map((r) => `- ${r.title}: ${r.snippet}`).join("\n");
    logger.info({ symbol, hits: results.length }, "Search results fetched");
    return snippets;
  } catch (error) {
    logger.warn({ error, symbol }, "Token news search failed");
    return "";
  }
}

export async function analyzePair(pair: TokenInfo, context: string, newsContext?: string): Promise<Signal | null> {
  try {
    const userParts = [
      `Analyze ${pair.symbol}`,
      `Price: $${pair.price}`,
      `24h Change: ${pair.priceChange24h}%`,
      `Volume: $${pair.volume24h}`,
      `Market Context: ${context}`,
    ];
    if (newsContext) {
      userParts.push(`\nRecent News / Sentiment:\n${newsContext}`);
    }

    const content = await callAceAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userParts.join("\n") },
    ]);

    if (!content) return null;

    const parsed = JSON.parse(content) as unknown;
    const signal = SignalSchema.parse(parsed);

    logger.info({ pair: pair.symbol, direction: signal.direction, confidence: signal.confidence }, "Signal generated");
    return signal;
  } catch (error) {
    logger.error({ error, pair: pair.symbol }, "Failed to analyze");
    return null;
  }
}

export async function analyzeBatch(pairs: TokenInfo[]): Promise<Signal[]> {
  const marketContext = pairs.slice(0, 5).map((p) => `${p.symbol}: $${p.price}`).join(" | ");

  const newsResults = await Promise.allSettled(
    pairs.map((p) => searchTokenNews(p.symbol))
  );
  const newsMap = new Map<string, string>();
  for (let i = 0; i < pairs.length; i++) {
    const r = newsResults[i]!;
    if (r.status === "fulfilled" && r.value) {
      newsMap.set(pairs[i]!.symbol, r.value);
    }
  }

  const results = await Promise.allSettled(
    pairs.map((p) => analyzePair(p, marketContext, newsMap.get(p.symbol)))
  );
  const signals: Signal[] = [];

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) signals.push(r.value);
  }

  logger.info({ total: pairs.length, signals: signals.length, withNews: newsMap.size }, "Batch analysis done");
  return signals;
}
