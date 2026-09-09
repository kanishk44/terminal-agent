import "dotenv/config";

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

type ProviderDefaults = {
  apiKeyEnv: string;
  baseURL: string;
  model: string;
};

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseURL: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
  openrouter: {
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    model: "deepseek/deepseek-chat",
  },
};

const provider = (process.env.PROVIDER ?? "deepseek").toLowerCase();
const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.deepseek;
const prefix = provider.toUpperCase();

export const config = {
  provider,
  apiKey: process.env.API_KEY ?? process.env[defaults.apiKeyEnv] ?? "",
  baseURL: process.env.BASE_URL ?? process.env[`${prefix}_BASE_URL`] ?? defaults.baseURL,
  model: process.env.MODEL ?? process.env[`${prefix}_MODEL`] ?? defaults.model,
  safeMode: parseBool(process.env.SAFE_MODE, true),
  maxRetries: Number(process.env.MAX_RETRIES ?? 3),
  maxToolIterations: Number(process.env.MAX_TOOL_ITERATIONS ?? 12),
  // OpenRouter-only: optional attribution headers, shown on openrouter.ai/rankings.
  openrouterSiteUrl: process.env.OPENROUTER_SITE_URL,
  openrouterAppName: process.env.OPENROUTER_APP_NAME,
};

export function requireApiKey(): void {
  if (!config.apiKey) {
    console.error(
      `Missing API key for provider "${provider}". Set ${defaults.apiKeyEnv} (or API_KEY) in your environment or .env file (see .env.example).`
    );
    process.exit(1);
  }
}
