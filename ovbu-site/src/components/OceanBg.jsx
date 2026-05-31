import React from 'react'
import { THEMES } from '../lib/theme'

export default function OceanBg({ themeKey }) {
  const t = THEMES[themeKey] || THEMES.mint
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: t.bg, zIndex: 1,
      pointerEvents: 'none',
      transition: 'background 0.6s ease',
    }} />
  )
}
