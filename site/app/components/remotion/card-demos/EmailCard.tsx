import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion"
import { C } from "../demos/shared"

export const EmailCard = () => {
  const frame = useCurrentFrame()

  const to = "dentist@sfsmiles.com"
  const subject = "Reschedule Request"
  const body = "Hi, can we move my appointment to Feb 20 at 2pm?"

  const toTyped = Math.min(to.length, Math.floor(Math.max(0, frame - 8) * 1.5))
  const subjectStart = 8 + to.length / 1.5 + 6
  const subjectTyped = Math.min(subject.length, Math.floor(Math.max(0, frame - subjectStart) * 1.5))
  const bodyStart = subjectStart + subject.length / 1.5 + 6
  const bodyTyped = Math.min(body.length, Math.floor(Math.max(0, frame - bodyStart) * 1.2))

  const sendFrame = bodyStart + body.length / 1.2 + 10
  const sendPulse = frame >= sendFrame && frame < sendFrame + 8
    ? interpolate(frame, [sendFrame, sendFrame + 4, sendFrame + 8], [1, 0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1
  const sentOpacity = interpolate(frame, [sendFrame + 10, sendFrame + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 14 }}>
      {/* To */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 8, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", width: 36 }}>To:</span>
        <span style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{to.slice(0, toTyped)}</span>
      </div>
      {/* Subject */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 8, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", width: 36 }}>Subject:</span>
        <span style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{subject.slice(0, subjectTyped)}</span>
      </div>
      {/* Body */}
      <div style={{ minHeight: 40, padding: 6, borderRadius: 6, background: C.bgCard, border: `1px solid ${C.border}`, marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
          {body.slice(0, bodyTyped)}
          {bodyTyped > 0 && bodyTyped < body.length && (
            <span style={{ display: "inline-block", width: 5, height: 10, background: C.green, marginLeft: 1, verticalAlign: "middle", borderRadius: 1 }} />
          )}
        </span>
      </div>
      {/* Send */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "inline-flex", padding: "3px 10px", borderRadius: 4,
          background: frame >= sendFrame ? C.green : C.accent,
          color: "#fff", fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          transform: `scale(${sendPulse})`,
        }}>
          {frame >= sendFrame + 10 ? "Sent" : "Send"}
        </div>
        <span style={{ fontSize: 8, color: C.green, fontFamily: "'JetBrains Mono', monospace", opacity: sentOpacity }}>
          &#10003; Delivered via SMTP
        </span>
      </div>
    </AbsoluteFill>
  )
}
