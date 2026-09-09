#!/usr/bin/env node
import readline from "node:readline";
import chalk from "chalk";
import { config, requireApiKey } from "./config.js";
import { Agent } from "./agent.js";

async function main() {
  requireApiKey();

  console.log(chalk.bold.magenta("Terminal Agent"));
  console.log(chalk.dim(`model: ${config.model} | safe mode: ${config.safeMode ? "on" : "off"}`));
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
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    }
    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.dim("\nGoodbye."));
    process.exit(0);
  });
}

main();
