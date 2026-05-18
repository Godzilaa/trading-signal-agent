import pino from "pino";
import { config } from "./config.js";
import type { TokenInfo } from "./types.js";

const JUPITER_API = "https://api.jup.ag/price/v3";

const logger = pino({ level: config.logLevel, name: "data-fetcher" });

const TOP_MINTS = [
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "J1toso1uCk3QLmjYX4Gpx8s3W1EJ7kUf6UfLGJQa9Hn",
  "27G8MtK7VtTcCHkpASjSD4WWKNkzBbY4D1YVcD9Jm6x",
  "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
  "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN",
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
];

const MINT_TO_SYMBOL: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "SOL",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr": "POPCAT",
  "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82": "WIF",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "W",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
  "J1toso1uCk3QLmjYX4Gpx8s3W1EJ7kUf6UfLGJQa9Hn": "JitoSOL",
  "27G8MtK7VtTcCHkpASjSD4WWKNkzBbY4D1YVcD9Jm6x": "JUP",
  "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5": "MEW",
  "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN": "PYTH",
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3": "PENGU",
};

export async function fetchTopPairs(): Promise<TokenInfo[]> {
  try {
    const url = `${JUPITER_API}?ids=${TOP_MINTS.slice(0, config.maxPairs).join(",")}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jupiter API error: ${res.status}`);

    const data = (await res.json()) as Record<string, {
      usdPrice: number;
      priceChange24h: number | null;
      liquidity: number;
    }>;

    const tokens: TokenInfo[] = Object.entries(data).map(([mint, info]) => ({
      mint,
      symbol: MINT_TO_SYMBOL[mint] ?? mint.slice(0, 8),
      price: info.usdPrice || 0,
      volume24h: info.liquidity,
      priceChange24h: info.priceChange24h ?? 0,
    }));

    logger.info({ count: tokens.length }, "Fetched market data");
    return tokens;
  } catch (error) {
    logger.error({ error }, "Failed to fetch market data");
    return [];
  }
}
