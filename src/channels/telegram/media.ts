import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { lookup } from 'mime-types';
import type { Api } from 'grammy';

const MEDIA_DIR = join(homedir(), '.dorabot', 'media', 'telegram');

function ensureMediaDir(): void {
  mkdirSync(MEDIA_DIR, { recursive: true });
}

/**
 * Download a Telegram file by file_id and save to ~/.dorabot/media/telegram/.
 * Returns { path, mimeType } of the saved file.
 */
export async function downloadTelegramFile(
  api: Api,
  fileId: string,
  fallbackExt: string = 'bin',
  fallbackMime?: string,
): Promise<{ path: string; mimeType: string }> {
  ensureMediaDir();

  const file = await api.getFile(fileId);
  const filePath = file.file_path; // e.g. "videos/file_123.mp4"
  if (!filePath) throw new Error(`Telegram returned no file_path for ${fileId}`);

  // derive extension from remote path, or fallback
  const ext = filePath.includes('.') ? filePath.split('.').pop()! : fallbackExt;
  const mimeType = fallbackMime || lookup(ext) || 'application/octet-stream';

  // unique local filename: timestamp + file_unique_id
  const localName = `${Date.now()}_${file.file_unique_id}.${ext}`;
  const localPath = join(MEDIA_DIR, localName);

  // download bytes
  const url = `https://api.telegram.org/file/bot${api.token}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(localPath, buffer);

  return { path: localPath, mimeType };
}