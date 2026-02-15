import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion"
import { C } from "../demos/shared"

export const MacCard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const commands = [
    { cmd: "move Safari to left half", icon: "◧", delay: 8 },
    { cmd: "move Terminal to right half", icon: "◨", delay: 28 },
    { cmd: "launch Spotify", icon: "♫", delay: 48 },
    { cmd: 'play "Feather" by Nujabes', icon: "▶", delay: 68 },
  ]

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 12 }}>
      {/* Mini desktop */}
      <div style={{ marginBottom: 10, padding: 6, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgCard, display: "flex", gap: 3, height: 44 }}>
        <div style={{
          flex: 1, borderRadius: 3, border: `1px solid ${C.border}`, background: C.bgSurface,
          opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateX(${interpolate(frame, [8, 22], [-14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace",
        }}>Safari</div>
        <div style={{
          flex: 1, borderRadius: 3, border: `1px solid ${C.border}`, background: C.bgSurface,
          opacity: interpolate(frame, [28, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateX(${interpolate(frame, [28, 42], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace",
        }}>Terminal</div>
      </div>

      {/* Command log */}
      {commands.map((cmd, i) => {
        const e = spring({ frame, fps, delay: cmd.delay, config: { damping: 200 } })
        const doneOpacity = interpolate(frame, [cmd.delay + 10, cmd.delay + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        return (
          <div key={i} style={{
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [6, 0])}px)`,
            display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
            borderBottom: i < commands.length - 1 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ fontSize: 9, width: 14, textAlign: "center" }}>{cmd.icon}</span>
            <span style={{ flex: 1, fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{cmd.cmd}</span>
            <span style={{ fontSize: 8, color: C.green, fontFamily: "'JetBrains Mono', monospace", opacity: doneOpacity }}>&#10003;</span>
          </div>
        )
      })}

      {/* Now playing */}
      {frame > 72 && (
        <div style={{
          marginTop: 8, padding: "5px 8px", borderRadius: 6, background: `${C.green}11`, border: `1px solid ${C.green}33`,
          display: "flex", alignItems: "center", gap: 6,
          opacity: interpolate(frame, [72, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontSize: 9 }}>&#9654;</span>
          <span style={{ fontSize: 8, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>Feather - Nujabes</span>
          <span style={{ marginLeft: "auto", fontSize: 7, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>40%</span>
        </div>
      )}
    </AbsoluteFill>
  )
}
