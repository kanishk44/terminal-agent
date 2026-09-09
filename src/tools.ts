import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createTwoFilesPatch } from "diff";
import chalk from "chalk";
import { config } from "./config.js";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
]);

class ToolError extends Error {}

function resolveInRoot(relativePath: string): string {
  const resolved = path.resolve(ROOT, relativePath);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new ToolError(
      `Refusing to access path outside project directory: ${relativePath}`
    );
  }
  return resolved;
}

function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`${question} (y/n) `), (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

function printDiff(filePath: string, before: string, after: string): void {
  const patch = createTwoFilesPatch(filePath, filePath, before, after, "", "");
  const lines = patch.split("\n").slice(4); // drop the header lines
  for (const line of lines) {
    if (line.startsWith("+")) console.log(chalk.green(line));
    else if (line.startsWith("-")) console.log(chalk.red(line));
    else if (line.startsWith("@@")) console.log(chalk.cyan(line));
    else console.log(chalk.dim(line));
  }
}

async function confirmChange(
  relativePath: string,
  before: string,
  after: string
): Promise<boolean> {
  console.log(chalk.bold(`\nProposed change to ${relativePath}:`));
  printDiff(relativePath, before, after);
  if (!config.safeMode) return true;
  return askYesNo("Apply this change?");
}

export async function readFile(args: { path: string }): Promise<string> {
  const full = resolveInRoot(args.path);
  if (!fs.existsSync(full)) {
    throw new ToolError(`File not found: ${args.path}`);
  }
  const content = fs.readFileSync(full, "utf-8");
  const MAX = 20000;
  if (content.length > MAX) {
    return content.slice(0, MAX) + `\n... [truncated, ${content.length} bytes total]`;
  }
  return content;
}

export async function listFiles(args: {
  path?: string;
  recursive?: boolean;
}): Promise<string> {
  const target = resolveInRoot(args.path ?? ".");
  if (!fs.existsSync(target)) {
    throw new ToolError(`Path not found: ${args.path ?? "."}`);
  }

  const results: string[] = [];
  const walk = (dir: string, depth: number) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      const rel = path.relative(ROOT, path.join(dir, entry.name));
      if (entry.isDirectory()) {
        results.push(`${rel}/`);
        if (args.recursive) walk(path.join(dir, entry.name), depth + 1);
      } else {
        results.push(rel);
      }
    }
  };

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    walk(target, 0);
  } else {
    results.push(path.relative(ROOT, target));
  }
  return results.join("\n") || "(empty)";
}

export async function writeFile(args: {
  path: string;
  content: string;
}): Promise<string> {
  const full = resolveInRoot(args.path);
  const before = fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
  const approved = await confirmChange(args.path, before, args.content);
  if (!approved) return "User rejected the write. No changes were made.";

  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, args.content, "utf-8");
  return `Wrote ${args.content.length} bytes to ${args.path}`;
}

export async function editFile(args: {
  path: string;
  old_string: string;
  new_string: string;
}): Promise<string> {
  const full = resolveInRoot(args.path);
  if (!fs.existsSync(full)) {
    throw new ToolError(`File not found: ${args.path}`);
  }
  const before = fs.readFileSync(full, "utf-8");
  const occurrences = before.split(args.old_string).length - 1;
  if (occurrences === 0) {
    throw new ToolError(
      `old_string not found in ${args.path}. Read the file first to get an exact match.`
    );
  }
  if (occurrences > 1) {
    throw new ToolError(
      `old_string matches ${occurrences} locations in ${args.path}; it must be unique. Include more surrounding context.`
    );
  }

  const after = before.replace(args.old_string, args.new_string);
  const approved = await confirmChange(args.path, before, after);
  if (!approved) return "User rejected the edit. No changes were made.";

  fs.writeFileSync(full, after, "utf-8");
  return `Edited ${args.path}`;
}

export const toolImplementations: Record<
  string,
  (args: any) => Promise<string>
> = {
  read_file: readFile,
  list_files: listFiles,
  write_file: writeFile,
  edit_file: editFile,
};

export const toolSchemas = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the full contents of a file in the project.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the project root." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_files",
      description: "List files and directories at a given path in the project.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory to list, relative to the project root. Defaults to '.'.",
          },
          recursive: {
            type: "boolean",
            description: "Whether to recurse into subdirectories.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description:
        "Create a new file or overwrite an existing file with the given content. Shows a diff and asks for confirmation in safe mode.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the project root." },
          content: { type: "string", description: "Full content to write to the file." },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_file",
      description:
        "Replace a unique, exact substring in an existing file with new content. Use read_file first to copy the exact text to replace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the project root." },
          old_string: { type: "string", description: "Exact, unique text to find." },
          new_string: { type: "string", description: "Text to replace it with." },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
];
