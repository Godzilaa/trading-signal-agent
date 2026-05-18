import { SapConnection } from "@oobe-protocol-labs/synapse-sap-sdk";
import { Keypair } from "@solana/web3.js";
import pino from "pino";
import { config } from "./config.js";
import bs58 from "bs58";

const logger = pino({ level: config.logLevel, name: "sap-agent" });

let client: ReturnType<typeof SapConnection.fromKeypair>["client"] | null = null;
let agentAddress: string | null = null;

export async function registerAgent(): Promise<{ address: string }> {
  const secretKey = bs58.decode(config.agentKeypair);
  const keypair = Keypair.fromSecretKey(secretKey);

  const sap = SapConnection.fromKeypair(config.rpc, keypair, {
    cluster: "mainnet-beta",
  });
  client = sap.client;

  const sig = await client.agent.register({
    name: "Market Signal Agent v1",
    description: "Autonomous trading signal generator using Ace Data Cloud AI",
    capabilities: [
      { id: "market-analysis", description: null, protocolId: "custom", version: "1.0" },
      { id: "trading-signals", description: null, protocolId: "custom", version: "1.0" },
    ],
    pricing: [],
    protocols: ["solana-agent-protocol"],
  });

  const [pda] = client.agent.deriveAgent(keypair.publicKey);
  agentAddress = pda.toBase58();

  logger.info({ address: agentAddress, sig }, "Agent registered on SAP");
  return { address: agentAddress };
}

export function getClient() {
  if (!client) throw new Error("Agent not registered yet");
  return client;
}
