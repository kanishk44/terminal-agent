#!/usr/bin/env node
import readline from "node:readline";
import chalk from "chalk";
import OpenAI from "openai";
import { config, requireApiKey } from "./config.js";
import { Agent } from "./agent.js";

function describeError(err: unknown): string {
  if (err instanceof OpenAI.RateLimitError) {
    const hint =
      config.provider === "openrouter"
        ? `Model "${config.model}" is rate-limited (common on free ":free" OpenRouter models under shared load). Try again shortly, switch MODEL to a non-free model or another provider, or add your own upstream key at https://openrouter.ai/settings/integrations.`
        : `Rate-limited by ${config.provider}. Try again shortly.`;
    return `429 rate limited — ${hint}`;
  }
  if (err instanceof OpenAI.APIError) {
    return `${err.status ?? ""} ${err.message}`.trim();
  }
  return err instanceof Error ? err.message : String(err);
}

async function main() {
  requireApiKey();

  console.log(chalk.bold.magenta("Terminal Agent"));
  console.log(
    chalk.dim(
      `provider: ${config.provider} | model: ${config.model} | safe mode: ${config.safeMode ? "on" : "off"}`
    )
  );
  console.log(chalk.dim("Type your request, or 'exit' to quit.\n"));

  const agent = new Agent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green("you> "),
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (["exit", "quit", ":q"].includes(input.toLowerCase())) {
      rl.close();
      return;
    }
    if (!input) {
      rl.prompt();
      return;
    }

    try {
      await agent.run(input);
    } catch (err) {
      console.error(chalk.red(`Error: ${describeError(err)}`));
    }
    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.dim("\nGoodbye."));
    process.exit(0);
  });
}

main();
