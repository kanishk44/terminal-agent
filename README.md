# Terminal Agent

A terminal-based AI coding agent powered by DeepSeek or OpenRouter (both
OpenAI-compatible APIs), inspired by [this write-up](https://nikhil-datasolutions.medium.com/building-a-terminal-based-ai-coding-agent-how-i-brought-deepseekai-to-the-command-line-3a5912e6ed8b).

It runs a tool-calling loop in your terminal: you describe what you want, the
model reads/writes files in the current project via a small set of tools, and
(in safe mode) shows a diff and asks for `y/n` confirmation before touching disk.

## Setup

```bash
npm install
cp .env.example .env   # then add your API key (see Providers below)
```

## Providers

Set `PROVIDER` in `.env` to switch backends; both use the same `openai` SDK
client under the hood since each exposes an OpenAI-compatible endpoint.

- `PROVIDER=deepseek` (default) — set `DEEPSEEK_API_KEY`. Model defaults to `deepseek-chat`.
- `PROVIDER=openrouter` — set `OPENROUTER_API_KEY`. Model defaults to `deepseek/deepseek-chat`;
  override with `MODEL=<any-openrouter-model-slug>` (e.g. `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`).
  `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME` are optional attribution headers shown on
  [openrouter.ai/rankings](https://openrouter.ai/rankings).

`BASE_URL` and `MODEL` (or provider-prefixed `DEEPSEEK_BASE_URL`/`OPENROUTER_MODEL` etc.) override the defaults for either provider.

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
- `execute_command(command, timeout_ms?)` — run a shell command in the project dir (confirm in safe mode; returns exit code/stdout/stderr, 30s default timeout)

## Config (env vars / `.env`)

| Var | Default | Meaning |
|---|---|---|
| `PROVIDER` | `deepseek` | `deepseek` or `openrouter` |
| `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` | — | required (whichever matches `PROVIDER`) |
| `BASE_URL` | per-provider | API base URL override |
| `MODEL` | per-provider | model name override |
| `SAFE_MODE` | `true` | require confirmation before writes/edits/commands |
| `MAX_TOOL_ITERATIONS` | `12` | cap on tool-call round trips per request |

Type `exit` to quit the REPL.
