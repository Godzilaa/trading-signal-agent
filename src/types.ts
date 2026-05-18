import { z } from "zod";

export const SignalSchema = z.object({
  pair: z.string(),
  direction: z.enum(["long", "short"]),
  confidence: z.number().min(0).max(1),
  entryPrice: z.number(),
  targetPrice: z.number(),
  stopPrice: z.number(),
  reasoning: z.string(),
  riskScore: z.number().min(1).max(10),
});

export type Signal = z.infer<typeof SignalSchema>;

export interface TokenInfo {
  mint: string;
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
}

export interface TradeResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
}
