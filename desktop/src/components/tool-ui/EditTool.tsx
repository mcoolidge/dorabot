import type { ToolUIProps } from "./index"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"

type DiffLine = { type: "ctx" | "del" | "add"; line: string }

function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split("\n")
  const newLines = newStr.split("\n")
  const m = oldLines.length
  const n = newLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "ctx", line: oldLines[i - 1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "add", line: newLines[j - 1] }); j--
    } else {
      result.push({ type: "del", line: oldLines[i - 1] }); i--
    }
  }
  return result.reverse()
}

const STYLES = {
  del: { bg: "diff-line-del", text: "text-destructive", gutter: "text-destructive/60", prefix: "\u2212" },
  add: { bg: "diff-line-add", text: "text-success", gutter: "text-success/60", prefix: "+" },
  ctx: { bg: "", text: "text-muted-foreground/60", gutter: "text-muted-foreground/25", prefix: " " },
} as const

export function EditTool({ input }: ToolUIProps) {
  let parsed: any = {}
  try { parsed = JSON.parse(input) } catch {}

  const filePath = parsed.file_path || ""
  const oldStr = parsed.old_string || ""
  const newStr = parsed.new_string || ""
  const lines = computeDiff(oldStr, newStr)

  let oldNum = 0, newNum = 0
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Pencil className="w-3.5 h-3.5 text-warning" />
        <span className="text-muted-foreground font-mono truncate">{filePath}</span>
        {parsed.replace_all && <Badge variant="outline" className="text-[9px] h-4">replace all</Badge>}
      </div>
      <div className="rounded-md border border-border/40 overflow-auto max-h-[200px] font-mono">
        {lines.map((d, i) => {
          if (d.type === "del" || d.type === "ctx") oldNum++
          if (d.type === "add" || d.type === "ctx") newNum++
          const s = STYLES[d.type]
          return (
            <div key={i} className={`flex text-[10px] leading-5 ${s.bg}`}>
              <span className={`w-7 text-right select-none shrink-0 pr-1 ${s.gutter}`}>
                {d.type !== "add" ? oldNum : ""}
              </span>
              <span className={`w-7 text-right select-none shrink-0 pr-1 border-r border-border/15 mr-1 ${s.gutter}`}>
                {d.type !== "del" ? newNum : ""}
              </span>
              <span className={`w-3 select-none shrink-0 text-center ${s.gutter}`}>{s.prefix}</span>
              <span className={`whitespace-pre-wrap break-all px-1 ${s.text}`}>{d.line || "\u00A0"}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
