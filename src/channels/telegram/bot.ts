import { readFileSync, existsSync } from 'node:fs';
import { Bot } from 'grammy';
import { TELEGRAM_TOKEN_PATH, toHomeAlias } from '../../workspace.js';

export type CreateBotOptions = {
  token: string;
};

export function resolveTelegramToken(tokenFile?: string): string {
  if (tokenFile && existsSync(tokenFile)) {
    return readFileSync(tokenFile, 'utf-8').trim();
  }

  const defaultFile = TELEGRAM_TOKEN_PATH;
  if (existsSync(defaultFile)) {
    return readFileSync(defaultFile, 'utf-8').trim();
  }

  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  throw new Error(`No Telegram bot token found. Set TELEGRAM_BOT_TOKEN env or save to ${toHomeAlias(TELEGRAM_TOKEN_PATH)}`);
}

export function createTelegramBot(opts: CreateBotOptions): Bot {
  return new Bot(opts.token);
}

export type TelegramBotInfo = {
  id: number;
  username: string;
  firstName: string;
};

export async function validateTelegramToken(token: string): Promise<TelegramBotInfo> {
  const bot = new Bot(token);
  const me = await bot.api.getMe();
  return { id: me.id, username: me.username || '', firstName: me.first_name };
}
