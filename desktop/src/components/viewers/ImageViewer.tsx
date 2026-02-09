import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  filePath: string;
  rpc: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
};

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

function getMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return MIME[ext] || 'image/png';
}

export function ImageViewer({ filePath, rpc }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    rpc('fs.readBinary', { path: filePath })
      .then((res) => {
        const { content } = res as { content: string };
        setSrc(`data:${getMime(filePath)};base64,${content}`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [filePath, rpc]);

  if (error) return <div className="p-4 text-destructive text-xs">{error}</div>;

  if (!src) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Skeleton className="w-64 h-64 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-0">
      <img
        src={src}
        alt={filePath.split('/').pop() || ''}
        className="max-w-full max-h-full object-contain rounded-md"
        draggable={false}
      />
    </div>
  );
}
