import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const SkillsCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const skills = [
    { name: "polymarket", category: "Finance", installs: "2.4k", delay: 8 },
    { name: "meme-generator", category: "Media", installs: "1.8k", delay: 20 },
    { name: "stripe-tools", category: "Business", installs: "5.1k", delay: 32 },
    { name: "himalaya-email", category: "Comms", installs: "3.2k", delay: 44 },
  ]

  // Install animation
  const installStart = 70
  const installProgress = interpolate(frame, [installStart, installStart + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const installDone = frame > installStart + 20
  const installDoneOpacity = interpolate(frame, [installStart + 20, installStart + 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Skills Gallery</span>
        <span style={{ marginLeft: "auto", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>56,000+ available</span>
      </div>

      {skills.map((s, i) => {
        const e = spring({ frame, fps, delay: s.delay, config: { damping: 200 } })
        const isTarget = i === 0
        return (
          <div key={i} style={{
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [8, 0])}px)`,
            padding: "5px 8px", marginBottom: 3, borderRadius: 5,
            border: `1px solid ${isTarget && installDone ? C.green + "55" : C.border}`,
            background: C.bgCard,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 8, color: C.accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{s.name}</span>
            <span style={{ fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{s.category}</span>
            <span style={{ marginLeft: "auto", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{s.installs}</span>
            {isTarget && (
              <span style={{ fontSize: 7, color: installDone ? C.green : C.accent, fontFamily: "'JetBrains Mono', monospace", padding: "1px 4px", borderRadius: 3, background: installDone ? `${C.green}22` : `${C.accent}22`, opacity: frame > installStart ? 1 : 0 }}>
                {installDone ? "installed" : "installing..."}
              </span>
            )}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
