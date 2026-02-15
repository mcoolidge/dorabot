import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const ScheduleCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const schedules = [
    { time: "9:00 AM", label: "Standup prep", delay: 8 },
    { time: "12:00 PM", label: "Check HN for AI news", delay: 20 },
    { time: "6:00 PM", label: "Evening digest", delay: 32 },
  ]

  const newMsg = "every friday at 5pm, expense report reminder"
  const createStart = 55
  const createTyped = Math.min(newMsg.length, Math.floor(Math.max(0, frame - createStart) * 1))

  const confirmStart = createStart + newMsg.length + 12
  const confirmOpacity = interpolate(frame, [confirmStart, confirmStart + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 12 }}>
      {schedules.map((s, i) => {
        const e = spring({ frame, fps, delay: s.delay, config: { damping: 200 } })
        return (
          <div key={i} style={{
            opacity: e,
            transform: `translateX(${interpolate(e, [0, 1], [-10, 0])}px)`,
            display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ width: 50, fontSize: 8, color: C.accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, flexShrink: 0 }}>{s.time}</span>
            <span style={{ flex: 1, fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
            <span style={{ fontSize: 6, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", padding: "1px 4px", borderRadius: 2, border: `1px solid ${C.border}` }}>DAILY</span>
          </div>
        )
      })}

      {createTyped > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>New:</div>
          <div style={{ padding: "5px 8px", borderRadius: 6, background: C.bgCard, border: `1px solid ${C.accent}44`, fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
            {newMsg.slice(0, createTyped)}
            {createTyped < newMsg.length && (
              <span style={{ display: "inline-block", width: 5, height: 10, background: C.green, marginLeft: 1, verticalAlign: "middle", borderRadius: 1 }} />
            )}
          </div>
        </div>
      )}

      {confirmOpacity > 0 && (
        <div style={{ marginTop: 6, opacity: confirmOpacity, padding: "5px 8px", borderRadius: 6, background: `${C.green}11`, border: `1px solid ${C.green}33`, fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: C.green }}>&#10003;</span>
          <span style={{ color: C.text }}> Scheduled: </span>
          <span style={{ color: C.accent }}>Fri 5 PM</span>
        </div>
      )}
    </AbsoluteFill>
  )
}
