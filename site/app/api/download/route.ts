import { NextResponse } from "next/server"

const REPO = "suitedaces/dorabot"
const FALLBACK = "https://github.com/suitedaces/dorabot/releases/latest"

export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 0 },
    })

    if (!res.ok) return NextResponse.redirect(FALLBACK)

    const release = await res.json()
    const dmg = release.assets?.find((a: any) => a.name.endsWith(".dmg") && !a.name.endsWith(".blockmap"))

    if (!dmg) return NextResponse.redirect(FALLBACK)

    return NextResponse.redirect(dmg.browser_download_url)
  } catch {
    return NextResponse.redirect(FALLBACK)
  }
}
