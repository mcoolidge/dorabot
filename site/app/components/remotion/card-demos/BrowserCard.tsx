import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion"
import { C } from "../demos/shared"

export const BrowserCard = () => {
  const frame = useCurrentFrame()

  const urlText = "https://booking.com/search"
  const urlTyped = Math.min(urlText.length, Math.floor(Math.max(0, frame - 8) * 1.8))

  const pageStart = 8 + urlText.length / 1.8 + 10
  const pageOpacity = interpolate(frame, [pageStart, pageStart + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  const fieldText = "San Francisco, Feb 20-22"
  const fieldStart = pageStart + 12
  const fieldTyped = Math.min(fieldText.length, Math.floor(Math.max(0, frame - fieldStart) * 1.2))

  const clickStart = fieldStart + fieldText.length / 1.2 + 10
  const clickScale = frame >= clickStart && frame < clickStart + 8
    ? interpolate(frame, [clickStart, clickStart + 4, clickStart + 8], [1, 0.93, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1

  const status1Opacity = interpolate(frame, [clickStart + 8, clickStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const status2Opacity = interpolate(frame, [clickStart + 20, clickStart + 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 0 }}>
      {/* URL bar */}
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: C.textMuted }}>&larr;</div>
          <div style={{ width: 10, height: 10, borderRadius: 3, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: C.textMuted }}>&rarr;</div>
        </div>
        <div style={{ flex: 1, padding: "3px 6px", borderRadius: 4, background: C.bgCard, fontSize: 9, color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>
          {urlText.slice(0, urlTyped)}
        </div>
      </div>

      {/* Page */}
      <div style={{ padding: 12, opacity: pageOpacity }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>Destination</div>
          <div style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${fieldTyped > 0 ? C.accent : C.border}`, background: C.bgCard, fontSize: 10, color: C.text, fontFamily: "'JetBrains Mono', monospace", minHeight: 18 }}>
            {fieldText.slice(0, fieldTyped)}
            {fieldTyped > 0 && fieldTyped < fieldText.length && (
              <span style={{ display: "inline-block", width: 5, height: 10, background: C.green, marginLeft: 1, verticalAlign: "middle", borderRadius: 1 }} />
            )}
          </div>
        </div>

        <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 4, background: C.accent, color: "#fff", fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", transform: `scale(${clickScale})` }}>
          Search
        </div>

        <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          <div style={{ opacity: status1Opacity, fontSize: 8, color: C.textSecondary, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>
            <span style={{ color: C.green }}>&#10003;</span> Filled destination field
          </div>
          <div style={{ opacity: status2Opacity, fontSize: 8, color: C.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: C.green }}>&#10003;</span> Found 23 results
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
