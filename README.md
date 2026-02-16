<div align="center">
  <img src="desktop/public/dorabot.png" width="120" />

  # dorabot

  **Open-source personal AI agent.**

  [![GitHub release](https://img.shields.io/github/v/release/suitedaces/dorabot)](https://github.com/suitedaces/dorabot/releases/latest)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](https://github.com/suitedaces/dorabot/releases/latest)

  Always-on autonomous AI agent that works while you sleep. Proposes goals, picks up tasks, ships code, and reports back via WhatsApp/Telegram. Configurable pulse intervals let it check in and make progress on its own schedule. Runs locally, bring your own model.

  [Download for macOS](https://github.com/suitedaces/dorabot/releases/latest) · [Website](https://dorabot.dev)

</div>

<img width="4336" height="2644" alt="Desktop app" src="https://github.com/user-attachments/assets/8ebfb9cf-0e41-45b9-9fed-26b5a9d14d5c" />

> **Goals board** - The desktop app's Kanban view where the agent proposes goals autonomously and you drag them through Proposed -> Approved -> In Progress -> Done. Each card is tagged with priority and progress.

<img alt="Goals Kanban board" src="public/desktop-goals.jpeg" width="800" />

> **Telegram channel** - A real conversation on Telegram where dorabot reports back after completing feature branches. It summarizes what shipped, what needs attention, and follows up by pushing branches when asked, all without leaving the chat.

<img alt="Telegram chat" src="public/image.png" width="400" />

## What It Does

- **Always-on autonomous mode** - Set pulse intervals (hourly, daily, etc.) and the agent checks in on its own, proposes new work, picks up approved tasks, and reports progress without you asking.
- **Proactive goal system** - Drag goals through a Kanban board (Proposed → Approved → In Progress → Done). The agent proposes goals autonomously, you approve with a click, it ships the work and messages you when done.
- **Chat anywhere** - WhatsApp, Telegram, Slack, or desktop app. Same agent, same memory, every channel.
- **Persistent memory** - Remembers everything. Full-text search across past conversations, builds context over time.
- **Browser automation** - Fill forms, click buttons, stay logged in across sessions. 90+ actions.
- **Control your Mac** - Windows, apps, Spotify, Calendar, Finder, system settings.
- **Work with GitHub** - PRs, issues, CI checks, code review.
- **Read and send email** - IMAP/SMTP via Himalaya CLI.
- **Schedule anything** - One-shot or recurring tasks with iCal RRULE.
- **Extend with skills** - 9 built-in, 56k+ community skills from [skills.sh](https://skills.sh), or ask the agent to create new ones on the fly.
- **Connect anything** - 7,300+ MCP servers via [Smithery](https://smithery.ai).

https://github.com/user-attachments/assets/d675347a-46c0-4767-b35a-e7a1db6386f9

## Quick Start

### Download (recommended)

Download the macOS app from [Releases](https://github.com/suitedaces/dorabot/releases/latest). Open the DMG, drag to Applications, done.

**Requirements:** macOS, Chrome/Brave/Edge (for browser features), and a Claude API key or Pro/Max subscription (or OpenAI API key).

### Build from source

```bash
git clone https://github.com/suitedaces/dorabot.git
cd dorabot
npm install
npm run build
npm link
```

```bash
# development
npm run dev           # gateway + desktop with HMR (auto-reload)
npm run dev:gateway   # gateway only with watch mode
npm run dev:cli       # interactive CLI mode

# production
dorabot -g            # gateway mode - powers desktop app and channels
dorabot -i            # interactive terminal
dorabot -m "what's the weather in SF?"   # one-off question
```

## Desktop App

- **Chat** - Full conversation view with streaming tool use
- **Goals** - Kanban board where you drag proposed goals to approved, agent picks them up and works autonomously
- **Automations** - Set pulse intervals (every 4 hours, daily, weekly, etc.) for autonomous check-ins
- **Channels** - Set up WhatsApp (QR code), Telegram (bot token), Slack
- **Skills** - Browse, install, edit. 56k+ community skills from the gallery.
- **Connectors** - Add MCP servers from Smithery or configure manually
- **Soul** - Edit personality (SOUL.md), profile (USER.md), memory (MEMORY.md)
- **Settings** - Model selection, approval modes, tool policies

## Multi-Provider Support

Pick the model you're already paying for.

| Provider | Auth | SDK |
|----------|------|-----|
| **Claude** (default) | API key or Pro/Max subscription | [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) |
| **OpenAI Codex** | API key or ChatGPT OAuth | [Codex SDK](https://www.npmjs.com/package/@openai/codex-sdk) |
| **MiniMax** | API key | OpenAI-compatible REST API |

Switch providers from the desktop Settings page or via gateway RPC.

## Channels

### WhatsApp

```bash
dorabot --whatsapp-login    # scan the QR code
```

### Telegram

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Set `TELEGRAM_BOT_TOKEN=your_token` in your environment (or save to `~/.dorabot/telegram/token`)
3. Start from the desktop app or config

Supports text, photos, videos, audio, documents, voice messages, and inline approval buttons.

### Slack

1. Create a Slack app with Socket Mode enabled
2. Add bot token scopes: `chat:write`, `im:history`, `im:read`, `im:write`, `files:read`, `files:write`, `users:read`
3. Add `connections:write` to the App-Level Token
4. Paste both tokens via the desktop app or `channels.slack.link` RPC

DM-based, same as Telegram. The bot listens for direct messages and responds in-thread.

## Skills

Built-in skills:

| Skill | What it does |
|-------|-------------|
| **github** | Issues, PRs, CI runs via `gh` CLI |
| **himalaya** | Email via IMAP/SMTP CLI |
| **macos** | Window management, apps, Spotify, Calendar, Finder |
| **image-gen** | Gemini API image generation and editing |
| **meme** | Meme generation via memegen.link |
| **onboard** | Interactive setup for USER.md and SOUL.md |
| **polymarket** | Polymarket data and predictions |
| **remotion** | Video creation in React |
| **agent-swarm-orchestration** | Multi-agent task orchestration |

**Add skills** three ways:
- **Manual** - Drop a `SKILL.md` in `~/.dorabot/skills/your-skill/`
- **Gallery** - Browse and install from 56k+ community skills on [skills.sh](https://skills.sh) via the desktop app
- **Agent-created** - Ask "make me a skill for deploying to Vercel" and the agent writes it and makes it available immediately

## Connectors (MCP Servers)

Add external tools via the [Model Context Protocol](https://modelcontextprotocol.io/). Browse 7,300+ servers from the [Smithery](https://smithery.ai) registry directly in the desktop app, or add your own with stdio/SSE/HTTP transport.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    }
  }
}
```

## Make It Yours

Ask dorabot to onboard you, or edit the files directly:

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality and tone |
| `USER.md` | Who you are, your preferences |
| `MEMORY.md` | Persistent facts across sessions |

All workspace files live in `~/.dorabot/workspace/` and are loaded into every session.


## Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Desktop  │  │ Telegram │  │ WhatsApp │  │  Slack   │
│(Electron)│  │ (grammy) │  │(Baileys) │  │ (Bolt)   │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └─────────┬───┴─────────────┴─────┬───────┘
               │                       │
      ┌────────▼────────┐              │
      │  Gateway Server  │  WebSocket RPC (port 18789)
      │  (server.ts)     │  Token-authenticated
      └────────┬────────┘
               │
      ┌────────▼────────┐
      │  Provider Layer  │  Claude / Codex / MiniMax
      │  (providers/)    │  Singleton + lazy init
      └────────┬────────┘
               │
  ┌────────┬───┼───┬──────────┐
  │        │   │   │          │
┌─▼─────┐┌▼───▼─┐┌▼───────┐┌─▼──────┐
│ Tools ││ Sess ││Sched + ││ Memory │
│ (MCP) ││(SQL) ││ Pulse  ││ (FTS5) │
└───────┘└──────┘└────────┘└────────┘
```

- **Gateway** - Central WebSocket server. All clients (desktop, WhatsApp, Telegram, Slack) connect here.
- **Providers** - Pluggable AI backend. Use Claude (Agent SDK) or OpenAI (Codex SDK). Bring your own API key or OAuth.
- **Sessions** - SQLite-backed. Persistent across restarts. 4-hour idle timeout.
- **Tools** - File ops, bash, browser, messaging, goals, scheduling, research, plus external MCP servers.
- **Browser** - Playwright with persistent profile. Stay logged into sites across sessions.
- **Memory** - SQLite FTS5. Full-text search over all past conversations.
- **Pulse** - Configurable intervals for autonomous check-ins. Agent wakes up, checks goals, proposes new work, picks up approved tasks.

## Config

`~/.dorabot/config.json`:

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "provider": {
    "name": "claude"
  },
  "channels": {
    "whatsapp": { "enabled": false },
    "telegram": { "enabled": false, "token": "" }
  }
}
```

## Security

- Scoped file access (default: `~/`, `/tmp`)
- Sensitive dirs always blocked: `~/.ssh`, `~/.gnupg`, `~/.aws`
- Token-authenticated gateway (256-bit hex)
- Configurable tool approval tiers (auto-allow, notify, require-approval)
- Channel-level security policies
- macOS app sandbox for native permission management

## License

MIT
