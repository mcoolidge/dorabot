import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion"
import { C } from "../demos/shared"

export const ChatCard = () => {
  const frame = useCurrentFrame()

  const userMsg = "remind me to call the dentist at 9am"
  const agentMsg = "Done. Reminder set for tomorrow at 9:00 AM."

  const userTyped = Math.min(userMsg.length, Math.floor(Math.max(0, frame - 10) * 1.2))
  const userDone = frame > 10 + userMsg.length / 1.2
  const agentStart = Math.floor(10 + userMsg.length / 1.2 + 15)
  const agentTyped = Math.min(agentMsg.length, Math.floor(Math.max(0, frame - agentStart) * 1.5))

  const checkOpacity = interpolate(frame, [agentStart + 5, agentStart + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const cursorOn = Math.floor(frame / 8) % 2 === 0

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 16 }}>
      {/* Channel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.bg, fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>D</div>
        <span style={{ fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>dorabot</span>
        <span style={{ fontSize: 7, color: C.green, fontFamily: "'JetBrains Mono', monospace" }}>online</span>
      </div>

      {/* User bubble */}
      {userTyped > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <div style={{
            maxWidth: "78%",
            padding: "6px 10px",
            borderRadius: "10px 10px 2px 10px",
            background: C.accent,
            color: "#fff",
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.5,
          }}>
            {userMsg.slice(0, userTyped)}
            {!userDone && <span style={{ display: "inline-block", width: 5, height: 10, background: cursorOn ? "#fff" : "transparent", marginLeft: 1, verticalAlign: "middle", borderRadius: 1 }} />}
          </div>
        </div>
      )}

      {/* Agent reply */}
      {agentTyped > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{
            maxWidth: "85%",
            padding: "6px 10px",
            borderRadius: "10px 10px 10px 2px",
            background: C.bgSurface,
            color: C.text,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.5,
          }}>
            <span style={{ color: C.green, opacity: checkOpacity }}>&#10003; </span>
            {agentMsg.slice(0, agentTyped)}
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
