# Terminal Agent

A terminal-based AI coding agent powered by the DeepSeek API (OpenAI-compatible),
inspired by [this write-up](https://nikhil-datasolutions.medium.com/building-a-terminal-based-ai-coding-agent-how-i-brought-deepseekai-to-the-command-line-3a5912e6ed8b).

It runs a tool-calling loop in your terminal: you describe what you want, the
model reads/writes files in the current project via a small set of tools, and
(in safe mode) shows a diff and asks for `y/n` confirmation before touching disk.

## Setup

```bash
npm install
cp .env.example .env   # then add your DEEPSEEK_API_KEY
```

## Run (dev, no build step)

```bash
npm run dev
```

## Build + run compiled

```bash
npm run build
npm start
```

## Tools available to the agent

- `read_file(path)` — read a file's contents
- `list_files(path?, recursive?)` — list a directory
- `write_file(path, content)` — create/overwrite a file (diff preview + confirm)
- `edit_file(path, old_string, new_string)` — replace a unique substring in a file (diff preview + confirm)

## Config (env vars / `.env`)

| Var | Default | Meaning |
|---|---|---|
| `DEEPSEEK_API_KEY` | — | required |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | API base URL |
| `DEEPSEEK_MODEL` | `deepseek-chat` | model name |
| `SAFE_MODE` | `true` | require confirmation before writes/edits |
| `MAX_TOOL_ITERATIONS` | `12` | cap on tool-call round trips per request |

Type `exit` to quit the REPL.
