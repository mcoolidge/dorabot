import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const MAX_DIMENSION = 7680;

// downscale a png/jpeg buffer so neither dimension exceeds MAX_DIMENSION
// uses macOS sips (no external deps)
export async function constrainImageSize(buffer: Buffer): Promise<Buffer> {
  const tmp = join(tmpdir(), `resize-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  await writeFile(tmp, buffer);

  const { stdout } = await execFileAsync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', tmp]);
  const w = parseInt(stdout.match(/pixelWidth:\s*(\d+)/)?.[1] || '0');
  const h = parseInt(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');

  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return buffer;

  const scale = MAX_DIMENSION / Math.max(w, h);
  const newW = Math.round(w * scale);
  const newH = Math.round(h * scale);

  await execFileAsync('sips', ['-z', String(newH), String(newW), tmp], { timeout: 15_000 });
  return readFile(tmp);
}
