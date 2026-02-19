import type { ApprovalUIProps } from "./index"
import { Target } from "lucide-react"

export function TaskApproval({ input }: ApprovalUIProps) {
  const goalId = input.goalId as string | undefined

  if (!goalId) return null

  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Target className="h-3 w-3" />
      goal #{goalId}
    </div>
  )
}
