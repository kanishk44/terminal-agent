import OpenAI from "openai";
import chalk from "chalk";
import { config } from "./config.js";
import { toolImplementations, toolSchemas } from "./tools.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SYSTEM_PROMPT = `You are a terminal-based AI coding agent running inside a user's project directory.
You can read files, list directories, write new files, edit existing files, and run shell commands using the tools provided.
Always call read_file before edit_file so your old_string matches exactly.
Prefer small, targeted edit_file calls over rewriting whole files with write_file.
Use execute_command to run tests, builds, linters, or package managers when it helps verify your work, but avoid destructive or irreversible commands.
Explain what you are about to do briefly, then use tools to do it. After tool results come back, continue until the task is complete, then give a concise final summary.`;

export class Agent {
  private client: OpenAI;
  private history: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  constructor() {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async run(userInput: string): Promise<void> {
    this.history.push({ role: "user", content: userInput });

    for (let i = 0; i < config.maxToolIterations; i++) {
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: this.history,
        tools: toolSchemas,
      });

      const message = response.choices[0].message;
      this.history.push(message as ChatCompletionMessageParam);

      if (message.content) {
        console.log(chalk.cyan("\nagent> ") + message.content);
      }

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return;
      }

      for (const toolCall of message.tool_calls) {
        const name = toolCall.function.name;
        const impl = toolImplementations[name];
        let result: string;

        try {
          const args = JSON.parse(toolCall.function.arguments || "{}");
          console.log(chalk.dim(`\n[tool] ${name}(${JSON.stringify(args)})`));
          result = impl
            ? await impl(args)
            : `Unknown tool: ${name}`;
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }

        this.history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    console.log(
      chalk.red(
        `\n[agent] Stopped after ${config.maxToolIterations} tool iterations to avoid a runaway loop.`
      )
    );
  }
}
