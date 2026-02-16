<div align="center">
  <img src="desktop/public/dorabot.png" width="120" />

  # dorabot

  **Open-source personal AI agent.**

  [![GitHub release](https://img.shields.io/github/v/release/suitedaces/dorabot)](https://github.com/suitedaces/dorabot/releases/latest)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](https://github.com/suitedaces/dorabot/releases/latest)

  Personal AI agent with persistent memory, multi-channel messaging (WhatsApp, Telegram, Slack), browser automation, email, Mac control, and a proactive goal system that proposes and ships work without being asked. Runs locally, bring your own model.

  [Download for macOS](https://github.com/suitedaces/dorabot/releases/latest) · [Website](https://dorabot.dev)

</div>

<img width="4336" height="2644" alt="Desktop app" src="https://github.com/user-attachments/assets/8ebfb9cf-0e41-45b9-9fed-26b5a9d14d5c" />

> **Goals board** - The desktop app's Kanban view where the agent proposes goals autonomously and you drag them through Proposed -> Approved -> In Progress -> Done. Each card is tagged with priority and progress.

<img alt="Goals Kanban board" src="public/desktop-goals.jpeg" width="800" />

> **Telegram channel** - A real conversation on Telegram where dorabot reports back after completing feature branches. It summarizes what shipped, what needs attention, and follows up by pushing branches when asked, all without leaving the chat.

<img alt="Telegram chat" src="public/image.png" width="400" />

## What It Does

- **Chat anywhere** - WhatsApp, Telegram, Slack, or the desktop app. Persistent memory across all channels.
- **Proactive goal management** - The agent proposes goals on its own, you approve via drag-and-drop Kanban board. It tracks progress, reports results, and picks up new work autonomously.
- **Browse the web** - Fill forms, click buttons, read pages, stay logged in across sessions. 90+ browser actions via Playwright.
- **Read and send email** - via Himalaya CLI (IMAP/SMTP, no OAuth needed).
- **Control your Mac** - Windows, apps, Spotify, Calendar, Finder, system settings via AppleScript.
- **Schedule anything** - One-shot reminders, recurring tasks, iCal-based scheduling with timezone support.
- **Work with GitHub** - PRs, issues, CI checks, code review via `gh` CLI.
- **Generate images** - Text-to-image and image editing via Gemini API.
- **Research and remember** - Full-text search across past conversations, daily journals, research notes. The agent builds context over time.
- **Connect anything** - 7,300+ MCP servers via [Smithery](https://smithery.ai) registry. Add tools for databases, APIs, SaaS products.
- **Extend with skills** - 9 built-in skills, 56k+ community skills from the [skills.sh](https://skills.sh) gallery, or ask the agent to create new ones on the fly.

https://github.com/user-attachments/assets/d675347a-46c0-4767-b35a-e7a1db6386f9

## Quick Start

### Download (recommended)

Download the macOS app from [Releases](https://github.com/suitedaces/dorabot/releases/latest). Open the DMG, drag to Applications, done. The app auto-updates.

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
# development - gateway + desktop with HMR
npm run dev

# production
dorabot -g            # gateway mode - powers desktop app and channels
dorabot -i            # interactive terminal
dorabot -m "what's the weather in SF?"   # one-off question
```

## Desktop App

An Electron app that connects to the gateway over WebSocket.

- **Chat** - Full chat interface with tool streaming UI, model selection, and effort levels
- **Goals** - Drag-and-drop Kanban board (Proposed, Approved, In Progress, Done)
- **Research** - View and manage research notes the agent collects over time
- **Channels** - Set up WhatsApp (QR code), Telegram (bot token), and Slack
- **Skills** - Browse built-in and community skills, create and edit your own
- **Connectors** - Add MCP servers from Smithery registry or configure manually
- **Soul** - Edit personality (SOUL.md), profile (USER.md), and memory (MEMORY.md)
- **Automations** - Manage scheduled tasks, reminders, and recurring runs with pulse intervals
- **Settings** - Provider setup, approval modes, sandbox config, tool policies

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

- **Gateway** - Central hub. ~70 RPC methods for config, sessions, channels, scheduling, skills, goals, research, connectors, provider management, and tool approval.
- **Providers** - Abstract interface. Claude uses Agent SDK (subprocess), Codex uses Codex SDK. Both support session resumption.
- **Sessions** - SQLite-backed. Persistent across restarts. 4-hour idle timeout for new conversations.
- **Tools** - Built-in via `claude_code` preset (Read, Write, Bash, etc.) plus custom MCP tools (messaging, browser, screenshot, goals, scheduling) plus external MCP servers.
- **Browser** - Playwright-based. 90+ actions. Persistent Chrome profile with authenticated sessions.
- **Memory** - SQLite FTS5 index over all past conversations. Full-text search, daily journals, research notes.
- **Scheduler** - iCal-based (RRULE). Scheduled runs route through the agent. Configurable pulse intervals for autonomous check-ins.

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
