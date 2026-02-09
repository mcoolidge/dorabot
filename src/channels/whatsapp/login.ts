import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createWaSocket, waitForConnection, getDefaultAuthDir, isAuthenticated } from './session.js';

export type LoginResult = { success: boolean; error?: string; selfJid?: string };
const DEFAULT_LOGIN_TIMEOUT_MS = 180000;

export async function loginWhatsApp(authDir?: string, onQr?: (qr: string) => void): Promise<LoginResult> {
  const dir = authDir || getDefaultAuthDir();
  mkdirSync(dir, { recursive: true });

  console.log('Connecting to WhatsApp... scan QR code when it appears.');

  const credsPath = join(dir, 'creds.json');
  if (existsSync(credsPath) && !isAuthenticated(dir)) {
    console.warn('Found stale WhatsApp auth state. Resetting auth files before login.');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }

  const envTimeout = Number(process.env.WHATSAPP_LOGIN_TIMEOUT_MS);
  const loginTimeoutMs = Number.isFinite(envTimeout) && envTimeout > 0
    ? envTimeout
    : DEFAULT_LOGIN_TIMEOUT_MS;

  let qrSeen = false;

  try {
    const sock = await createWaSocket({
      authDir: dir,
      onQr: (qr) => {
        qrSeen = true;
        if (onQr) {
          onQr(qr);
        } else {
          try {
            const qrt = require('qrcode-terminal');
            qrt.generate(qr, { small: true });
          } catch {
            console.log('QR code:', qr);
          }
        }
      },
      onConnection: (state, err) => {
        if (state === 'open') {
          console.log('WhatsApp connected!');
        } else if (state === 'close') {
          console.log('Connection closed:', err?.message);
        }
      },
    });

    await waitForConnection(sock, loginTimeoutMs);

    const selfJid = (sock as any).authState?.creds?.me?.id;
    console.log(`Logged in as: ${selfJid || 'unknown'}`);

    // disconnect after login
    sock.end(undefined);

    return { success: true, selfJid };
  } catch (err) {
    let error = err instanceof Error ? err.message : String(err);
    if (error.includes('timed out') && !qrSeen) {
      error += '. QR was not generated. Check internet/firewall access to WhatsApp Web and retry.';
    }
    return { success: false, error };
  }
}

export async function logoutWhatsApp(authDir?: string): Promise<void> {
  const dir = authDir || getDefaultAuthDir();
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log('WhatsApp session removed.');
  } else {
    console.log('No WhatsApp session found.');
  }
}

export function isWhatsAppLinked(authDir?: string): boolean {
  const dir = authDir || getDefaultAuthDir();
  return isAuthenticated(dir);
}
