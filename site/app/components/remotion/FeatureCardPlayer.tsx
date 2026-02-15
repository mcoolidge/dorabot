"use client"

import { Player } from "@remotion/player"
import { useEffect, useState, ComponentType } from "react"

interface FeatureCardPlayerProps {
  component: ComponentType
  durationInFrames?: number
  compositionWidth?: number
  compositionHeight?: number
}

export function FeatureCardPlayer({
  component,
  durationInFrames = 150,
  compositionWidth = 400,
  compositionHeight = 240,
}: FeatureCardPlayerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: `${compositionWidth}/${compositionHeight}`,
          background: "rgba(26, 26, 46, 0.6)",
          borderRadius: "12px 12px 0 0",
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: "100%",
        borderRadius: "12px 12px 0 0",
        overflow: "hidden",
      }}
    >
      <Player
        component={component}
        durationInFrames={durationInFrames}
        fps={30}
        compositionWidth={compositionWidth}
        compositionHeight={compositionHeight}
        style={{ width: "100%", aspectRatio: `${compositionWidth}/${compositionHeight}` }}
        autoPlay
        loop
        controls={false}
        allowFullscreen={false}
        clickToPlay={false}
      />
    </div>
  )
}
