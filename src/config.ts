import "dotenv/config";

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const config = {
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  safeMode: parseBool(process.env.SAFE_MODE, true),
  maxRetries: Number(process.env.MAX_RETRIES ?? 3),
  maxToolIterations: Number(process.env.MAX_TOOL_ITERATIONS ?? 12),
};

export function requireApiKey(): void {
  if (!config.apiKey) {
    console.error(
      "Missing DEEPSEEK_API_KEY. Set it in your environment or in a .env file (see .env.example)."
    );
    process.exit(1);
  }
}
