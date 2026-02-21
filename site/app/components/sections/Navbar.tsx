"use client"

import { useEffect, useState, useRef } from "react"

function GithubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Navbar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const saved = localStorage.getItem("dorabot-site-theme")
    const initial: "dark" | "light" = saved === "light" ? "light" : "dark"
    setTheme(initial)
    document.documentElement.classList.toggle("dark", initial === "dark")
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 50) {
        setVisible(true)
        setScrolled(false)
      } else {
        setScrolled(true)
        setVisible(y < lastY.current)
        if (y > lastY.current) setMobileOpen(false)
      }
      lastY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      document.documentElement.classList.toggle("dark", next === "dark")
      localStorage.setItem("dorabot-site-theme", next)
      return next
    })
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-[5000] transition-all duration-300 border-b ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${
        scrolled || mobileOpen ? "bg-bg sm:backdrop-blur-xl sm:bg-bg/80 border-border" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-2.5 sm:px-8 sm:py-3.5 lg:px-12">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-1.5">
            <img
              src="/dorabot.png"
              alt="dorabot"
              width={67}
              height={91}
              decoding="async"
              className="h-10 w-auto sm:h-11 dorabot-alive"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-base text-text-secondary font-medium">dorabot</span>
          </div>
          <a href="#features" className="hidden sm:block text-sm text-text-secondary hover:text-text transition-colors">
            Features
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-card text-text-secondary transition-colors hover:text-text"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M21 12.79A9 9 0 1111.21 3c0 .28.01.56.04.84A7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <a
              href="https://github.com/suitedaces/dorabot"
              className="star-glow inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-bg-card px-4 py-2 text-sm font-medium text-text"
            >
              <GithubIcon />
              <span>Star on GitHub</span>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </a>
          </div>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-text transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
            <span className={`block h-0.5 w-5 bg-text transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-text transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""}`} />
          </button>
        </div>
      </div>
      <div className={`sm:hidden overflow-hidden transition-all duration-200 ${
        mobileOpen ? "max-h-96 opacity-100 border-t border-border" : "max-h-0 opacity-0"
      }`}>
        <div className="flex flex-col gap-1 px-4 py-4">
          <a href="#features" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm text-text-secondary hover:text-text transition-colors">
            Features
          </a>
          <div className="mt-2 border-t border-border pt-3 flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-card text-text-secondary transition-colors hover:text-text"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M21 12.79A9 9 0 1111.21 3c0 .28.01.56.04.84A7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <a
              href="https://github.com/suitedaces/dorabot"
              className="star-glow inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-bg-card px-4 py-2 text-sm font-medium text-text"
            >
              <GithubIcon />
              Star on GitHub
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
