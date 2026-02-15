import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const MemoryCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const files = [
    { name: "SOUL.md", desc: "Personality", color: C.purple, delay: 8 },
    { name: "USER.md", desc: "Profile", color: C.accent, delay: 20 },
    { name: "MEMORY.md", desc: "Learned facts", color: C.green, delay: 32 },
  ]

  // Memory being written
  const writeStart = 50
  const writeText = "Ishan prefers hyphens over em dashes"
  const writeTyped = Math.min(writeText.length, Math.floor(Math.max(0, frame - writeStart) * 0.9))

  const savedStart = writeStart + writeText.length / 0.9 + 10
  const savedOpacity = interpolate(frame, [savedStart, savedStart + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 12 }}>
      <div style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginBottom: 10 }}>
        ~/.dorabot/workspace/
      </div>

      {files.map((f, i) => {
        const e = spring({ frame, fps, delay: f.delay, config: { damping: 200 } })
        return (
          <div key={i} style={{
            opacity: e,
            transform: `translateX(${interpolate(e, [0, 1], [-10, 0])}px)`,
            padding: "6px 8px", marginBottom: 4, borderRadius: 5,
            border: `1px solid ${C.border}`, background: C.bgCard,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 9, color: f.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{f.name}</span>
            <span style={{ fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{f.desc}</span>
            <span style={{ marginLeft: "auto", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {f.name === "MEMORY.md" && frame > writeStart && savedOpacity <= 0.5 ? "writing..." : ""}
              {f.name === "MEMORY.md" && savedOpacity > 0.5 ? "saved" : ""}
            </span>
          </div>
        )
      })}

      {/* Write animation */}
      {writeTyped > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>+ MEMORY.md</div>
          <div style={{ padding: "5px 8px", borderRadius: 5, background: C.bgCard, border: `1px solid ${C.green}33`, fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
            {writeText.slice(0, writeTyped)}
            {writeTyped < writeText.length && (
              <span style={{ display: "inline-block", width: 5, height: 10, background: C.green, marginLeft: 1, verticalAlign: "middle", borderRadius: 1 }} />
            )}
          </div>
        </div>
      )}

      {savedOpacity > 0 && (
        <div style={{ marginTop: 6, opacity: savedOpacity, fontSize: 8, color: C.green, fontFamily: "'JetBrains Mono', monospace" }}>
          &#10003; Persisted to disk - will remember next session
        </div>
      )}
    </AbsoluteFill>
  )
}
