/**
 * Image validation for Anthropic Claude API constraints.
 *
 * Limits (API):
 *   - Max 5 MB per image
 *   - Max 8000 x 8000 pixels
 *   - Formats: image/jpeg, image/png, image/gif, image/webp
 *
 * Performance sweet spot (Anthropic recommendation):
 *   - 1568 px max dimension, ~1.15 megapixels
 *   - ~1600 tokens per image (width * height / 750)
 */

import type { ImageAttachment } from './types.js';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 8000; // px

export type ImageGuardResult =
  | { ok: true; image: ImageAttachment }
  | { ok: false; reason: string };

/** Decode base64 length to approximate byte count (exact for padded base64). */
function base64ByteSize(b64: string): number {
  // Strip data URI prefix if present
  const raw = b64.includes(',') ? b64.split(',')[1] : b64;
  const padding = (raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0);
  return Math.floor((raw.length * 3) / 4) - padding;
}

/** Read a 16-bit big-endian unsigned int from a buffer. */
function readU16BE(buf: Buffer, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1];
}

/** Read a 32-bit big-endian unsigned int from a buffer. */
function readU32BE(buf: Buffer, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

/** Read a 16-bit little-endian unsigned int from a buffer. */
function readU16LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

type Dimensions = { width: number; height: number };

function parsePngDimensions(buf: Buffer): Dimensions | null {
  // PNG signature: 137 80 78 71 13 10 26 10
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) return null;
  // IHDR chunk starts at byte 8, width at 16, height at 20
  return { width: readU32BE(buf, 16), height: readU32BE(buf, 20) };
}

function parseJpegDimensions(buf: Buffer): Dimensions | null {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xFF) { offset++; continue; }
    const marker = buf[offset + 1];
    // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
    if (
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    ) {
      // SOF: length(2) + precision(1) + height(2) + width(2)
      const height = readU16BE(buf, offset + 5);
      const width = readU16BE(buf, offset + 7);
      return { width, height };
    }
    // Skip this marker segment
    const segLen = readU16BE(buf, offset + 2);
    offset += 2 + segLen;
  }
  return null;
}

function parseGifDimensions(buf: Buffer): Dimensions | null {
  // GIF87a or GIF89a
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  return { width: readU16LE(buf, 6), height: readU16LE(buf, 8) };
}

function parseWebpDimensions(buf: Buffer): Dimensions | null {
  // RIFF....WEBP
  if (buf.length < 30) return null;
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;

  const chunkType = buf.toString('ascii', 12, 16);

  // VP8 (lossy)
  if (chunkType === 'VP8 ' && buf.length >= 30) {
    // Frame header at offset 26 (after chunk header)
    const w = readU16LE(buf, 26) & 0x3FFF;
    const h = readU16LE(buf, 28) & 0x3FFF;
    return { width: w, height: h };
  }

  // VP8L (lossless)
  if (chunkType === 'VP8L' && buf.length >= 25) {
    // 1 byte signature + 4 bytes packed w/h at offset 21
    const bits = (buf[21] | (buf[22] << 8) | (buf[23] << 16) | (buf[24] << 24)) >>> 0;
    const w = (bits & 0x3FFF) + 1;
    const h = ((bits >> 14) & 0x3FFF) + 1;
    return { width: w, height: h };
  }

  // VP8X (extended)
  if (chunkType === 'VP8X' && buf.length >= 30) {
    const w = ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xFFFFFF) + 1;
    const h = ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xFFFFFF) + 1;
    return { width: w, height: h };
  }

  return null;
}

function parseDimensions(buf: Buffer, mediaType: string): Dimensions | null {
  switch (mediaType) {
    case 'image/png': return parsePngDimensions(buf);
    case 'image/jpeg': return parseJpegDimensions(buf);
    case 'image/gif': return parseGifDimensions(buf);
    case 'image/webp': return parseWebpDimensions(buf);
    default: return null;
  }
}

/**
 * Validate a single image against Anthropic API constraints.
 * Returns the image unchanged if valid, or a reason string if rejected.
 */
export function guardImage(img: ImageAttachment): ImageGuardResult {
  // 1. MIME type
  if (!SUPPORTED_TYPES.has(img.mediaType)) {
    return { ok: false, reason: `Unsupported image type "${img.mediaType}". Claude accepts: jpeg, png, gif, webp.` };
  }

  // 2. File size
  const bytes = base64ByteSize(img.data);
  if (bytes > MAX_FILE_BYTES) {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return { ok: false, reason: `Image too large (${mb} MB). Claude API limit is 5 MB.` };
  }

  // 3. Pixel dimensions
  try {
    const raw = img.data.includes(',') ? img.data.split(',')[1] : img.data;
    const buf = Buffer.from(raw, 'base64');
    const dims = parseDimensions(buf, img.mediaType);
    if (dims) {
      if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
        return {
          ok: false,
          reason: `Image dimensions ${dims.width}x${dims.height} exceed Claude's ${MAX_DIMENSION}px limit.`,
        };
      }
    }
  } catch {
    // Can't parse dimensions, let the API handle it
  }

  return { ok: true, image: img };
}

/**
 * Filter an array of images, returning valid ones and a warning string
 * for any that were dropped.
 */
export function guardImages(images: ImageAttachment[]): { valid: ImageAttachment[]; warnings: string[] } {
  const valid: ImageAttachment[] = [];
  const warnings: string[] = [];

  for (const img of images) {
    const result = guardImage(img);
    if (result.ok) {
      valid.push(result.image);
    } else {
      warnings.push(result.reason);
    }
  }

  return { valid, warnings };
}
