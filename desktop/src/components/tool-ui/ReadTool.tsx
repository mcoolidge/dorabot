import type { ToolUIProps } from "./index"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Image } from "lucide-react"

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']

function isImagePath(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTS.includes(ext)
}

export function ReadTool({ input, output, imageData, isError }: ToolUIProps) {
  let parsed: any = {}
  try { parsed = JSON.parse(input) } catch {}

  const filePath = parsed.file_path || ""
  const offset = parsed.offset
  const limit = parsed.limit
  const isImage = isImagePath(filePath)
  const imgSrc = imageData || (isImage && output && output.startsWith("data:") ? output : undefined)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        {isImage ? <Image className="w-3.5 h-3.5 text-primary" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
        <span className="text-muted-foreground font-mono truncate">{filePath}</span>
        {offset && <Badge variant="outline" className="text-[9px] h-4">{`L${offset}${limit ? `-${offset + limit}` : ''}`}</Badge>}
      </div>
      {imgSrc && !isError && (
        <div className="rounded-md border border-border overflow-hidden">
          <img src={imgSrc} alt={filePath.split('/').pop() || ''} className="max-w-full max-h-[300px] object-contain" />
        </div>
      )}
      {output && !imgSrc && (
        <ScrollArea className="max-h-[200px] rounded-md bg-background border border-border">
          <pre className={`p-3 text-[11px] font-mono whitespace-pre-wrap ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
            {output.slice(0, 3000)}
          </pre>
        </ScrollArea>
      )}
    </div>
  )
}
