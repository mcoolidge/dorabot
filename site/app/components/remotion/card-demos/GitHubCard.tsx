import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const GitHubCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const items = [
    { type: "pr", title: "#42 Add Slack integration", status: "merged", statusColor: C.purple, delay: 8 },
    { type: "issue", title: "#38 Memory leak in gateway", status: "closed", statusColor: C.red, delay: 22 },
    { type: "pr", title: "#45 Update SDK to 0.2.42", status: "open", statusColor: C.green, delay: 36 },
  ]

  // CI check animation
  const ciStart = 65
  const ciProgress = interpolate(frame, [ciStart, ciStart + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const ciDone = frame > ciStart + 35
  const ciDoneOpacity = interpolate(frame, [ciStart + 35, ciStart + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>suitedaces/dorabot</span>
      </div>

      {items.map((item, i) => {
        const e = spring({ frame, fps, delay: item.delay, config: { damping: 200 } })
        return (
          <div key={i} style={{
            opacity: e,
            transform: `translateX(${interpolate(e, [0, 1], [-10, 0])}px)`,
            padding: "6px 8px", marginBottom: 4, borderRadius: 5,
            border: `1px solid ${C.border}`, background: C.bgCard,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 8, color: item.statusColor, fontFamily: "'JetBrains Mono', monospace" }}>
              {item.type === "pr" ? "PR" : "IS"}
            </span>
            <span style={{ flex: 1, fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.title}
            </span>
            <span style={{ fontSize: 7, color: item.statusColor, fontFamily: "'JetBrains Mono', monospace", padding: "1px 4px", borderRadius: 3, border: `1px solid ${item.statusColor}33`, flexShrink: 0 }}>
              {item.status}
            </span>
          </div>
        )
      })}

      {/* CI check */}
      <div style={{ marginTop: 8, padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.bgCard }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>CI: build + test</span>
          <span style={{ marginLeft: "auto", fontSize: 7, color: ciDone ? C.green : C.orange, fontFamily: "'JetBrains Mono', monospace", opacity: frame > ciStart ? 1 : 0 }}>
            {ciDone ? "passed" : "running..."}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: C.bgSurface, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: ciDone ? C.green : C.accent, width: `${ciProgress * 100}%` }} />
        </div>
      </div>
    </AbsoluteFill>
  )
}
