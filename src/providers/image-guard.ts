/**
 * Image validation + auto-resize for Anthropic Claude API constraints.
 *
 * Limits (API):
 *   - Max 5 MB per image
 *   - Max 8000 x 8000 pixels
 *   - Formats: image/jpeg, image/png, image/gif, image/webp
 *
 * Strategy: instead of rejecting oversized images, resize them to
 * Anthropic's recommended sweet spot (1568px max dimension) and
 * compress as JPEG. This handles phone photos, screenshots, etc.
 */

import sharp from 'sharp';
import type { ImageAttachment } from './types.js';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const TARGET_MAX_DIM = 1568; // Anthropic recommended max dimension
const JPEG_QUALITY = 85;

export type ImageGuardResult =
  | { ok: true; image: ImageAttachment }
  | { ok: false; reason: string };

function stripDataUri(b64: string): string {
  return b64.includes(',') ? b64.split(',')[1] : b64;
}

function base64ByteSize(b64: string): number {
  const raw = stripDataUri(b64);
  const padding = (raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0);
  return Math.floor((raw.length * 3) / 4) - padding;
}

/**
 * Validate and auto-resize a single image for Claude API.
 * - Unsupported formats are rejected.
 * - Oversized images are resized to 1568px max dimension and compressed as JPEG.
 * - GIFs are converted to PNG (sharp doesn't output GIF).
 */
export async function guardImage(img: ImageAttachment): Promise<ImageGuardResult> {
  if (!SUPPORTED_TYPES.has(img.mediaType)) {
    return { ok: false, reason: `Unsupported image type "${img.mediaType}". Claude accepts: jpeg, png, gif, webp.` };
  }

  const rawB64 = stripDataUri(img.data);
  const buf = Buffer.from(rawB64, 'base64');
  const bytes = buf.length;

  // If already within limits, return as-is
  try {
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const needsResize = w > TARGET_MAX_DIM || h > TARGET_MAX_DIM;
    const needsCompress = bytes > MAX_FILE_BYTES;

    if (!needsResize && !needsCompress) {
      return { ok: true, image: img };
    }
  } catch {
    // Can't read metadata, try to pass through
    if (bytes <= MAX_FILE_BYTES) {
      return { ok: true, image: img };
    }
  }

  // Resize and compress
  try {
    let pipeline = sharp(buf).resize({
      width: TARGET_MAX_DIM,
      height: TARGET_MAX_DIM,
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Always convert to JPEG. PNG is bloated and causes issues.
    let outputBuf = await pipeline
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    let outputType = 'image/jpeg';

    // Lower quality if still too large
    if (outputBuf.length > MAX_FILE_BYTES) {
      outputBuf = await sharp(buf)
        .resize({ width: TARGET_MAX_DIM, height: TARGET_MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 60 })
        .toBuffer();
    }

    if (outputBuf.length > MAX_FILE_BYTES) {
      return { ok: false, reason: `Image still too large after compression (${(outputBuf.length / (1024 * 1024)).toFixed(1)} MB). Try a smaller image.` };
    }

    return {
      ok: true,
      image: {
        mediaType: outputType as ImageAttachment['mediaType'],
        data: outputBuf.toString('base64'),
      },
    };
  } catch (err) {
    return { ok: false, reason: `Failed to process image: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Filter and auto-resize an array of images.
 */
export async function guardImages(images: ImageAttachment[]): Promise<{ valid: ImageAttachment[]; warnings: string[] }> {
  const valid: ImageAttachment[] = [];
  const warnings: string[] = [];

  const results = await Promise.all(images.map(img => guardImage(img)));
  for (const result of results) {
    if (result.ok) {
      valid.push(result.image);
    } else {
      warnings.push(result.reason);
    }
  }

  return { valid, warnings };
}
