import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const GoalsCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const goals = [
    { title: "Ship README + landing page", status: "in_progress", color: C.orange },
    { title: "Study Castari as competitive intel", status: "proposed", color: C.textMuted },
    { title: "Integrate SDK 0.2.42 features", status: "proposed", color: C.textMuted },
  ]

  const goalEntrances = goals.map((_, i) => spring({ frame, fps, delay: 10 + i * 14, config: { damping: 200 } }))

  // First goal goes done
  const doneProgress = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  // Second gets approved
  const approveProgress = interpolate(frame, [100, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Active Goals</span>
        <span style={{ fontSize: 8, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>3 items</span>
      </div>

      {goals.map((g, i) => {
        const e = goalEntrances[i]
        const isDone = i === 0 && doneProgress > 0.5
        const isApproved = i === 1 && approveProgress > 0.5
        const dotColor = isDone ? C.green : isApproved ? C.accent : g.color
        const label = isDone ? "done" : isApproved ? "approved" : g.status.replace("_", " ")

        return (
          <div
            key={i}
            style={{
              opacity: e,
              transform: `translateX(${interpolate(e, [0, 1], [-12, 0])}px)`,
              padding: "7px 10px",
              marginBottom: 4,
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.bgCard,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
            <span style={{
              flex: 1,
              fontSize: 9,
              color: isDone ? C.textSecondary : C.text,
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: isDone ? "line-through" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {g.title}
            </span>
            <span style={{ fontSize: 7, color: dotColor, fontFamily: "'JetBrains Mono', monospace", padding: "1px 4px", borderRadius: 3, border: `1px solid ${dotColor}33`, flexShrink: 0 }}>
              {label}
            </span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
