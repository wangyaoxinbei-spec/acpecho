import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'

import OceanBg from './components/OceanBg'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import { DanmakuWall } from './components/DanmakuWall'
import { THEMES } from './lib/theme'

import { MeetingPage } from './pages/MeetingPage'
import { LunchPage } from './pages/LunchPage'
import { SettingsPage } from './pages/SettingsPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { BookingPage } from './pages/PlaceholderPages'

const isMobile = () => window.innerWidth < 768

const TABS = [
  { path: '/',         icon: '🍍', label: '会议室' },
  { path: '/lunch',    icon: '🍔', label: '午餐'   },
  { path: '/booking',  icon: '📅', label: '预约'   },
  { path: '/feedback', icon: '✉️', label: '寄信'   },
  { path: '/settings', icon: '⚓️', label: '设置'   },
]

function MobileBottomNav({ t }) {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: t.dark ? 'rgba(10,10,20,0.92)' : 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid ' + t.cardBorder,
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            flex: 1, padding: '10px 0 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? t.activeText : t.textSub }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const [username] = useState(() => localStorage.getItem('ovbu_username') || '')
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('ovbu_theme') || 'mint')
  const [mobile, setMobile] = useState(isMobile())
  const t = THEMES[themeKey] || THEMES.mint

  useEffect(() => {
    const handler = () => setMobile(isMobile())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const cardBg     = t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)'
  const cardBorder = t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)'
  const cardShadow = t.dark ? '0 25px 50px -12px rgba(0,0,0,0.4)' : '0 25px 50px -12px rgba(4,47,31,0.15)'

  if (mobile) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: 70 }}>
        <OceanBg themeKey={themeKey} />
        <DanmakuWall />
        <div style={{
          position: 'relative', zIndex: 20,
          margin: '12px 12px 0',
          background: cardBg,
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px',
          border: '1px solid ' + cardBorder,
          minHeight: 'calc(100vh - 94px)',
          overflow: 'hidden',
        }}>
          <TopBar username={username} t={t} mobile={true} />
          <main style={{ padding: '12px 16px 24px', overflowY: 'auto' }}>
            <Routes>
              <Route path="/"         element={<MeetingPage t={t} />} />
              <Route path="/booking"  element={<BookingPage t={t} />} />
              <Route path="/lunch"    element={<LunchPage t={t} />} />
              <Route path="/feedback" element={<FeedbackPage t={t} />} />
              <Route path="/settings" element={<SettingsPage t={t} onThemeChange={setThemeKey} />} />
            </Routes>
          </main>
        </div>
        <MobileBottomNav t={t} />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', boxSizing: 'border-box',
    }}>
      <OceanBg themeKey={themeKey} />
      <DanmakuWall />
      <div style={{
        position: 'relative', zIndex: 20,
        width: '100%', maxWidth: '1280px', minHeight: '85vh',
        background: cardBg,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '32px',
        border: '1px solid ' + cardBorder,
        boxShadow: cardShadow,
        display: 'flex', overflow: 'hidden',
      }}>
        <Sidebar t={t} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar username={username} t={t} />
          <main style={{ flex: 1, padding: '24px 32px 40px 32px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <Routes>
              <Route path="/"         element={<MeetingPage t={t} />} />
              <Route path="/booking"  element={<BookingPage t={t} />} />
              <Route path="/lunch"    element={<LunchPage t={t} />} />
              <Route path="/feedback" element={<FeedbackPage t={t} />} />
              <Route path="/settings" element={<SettingsPage t={t} onThemeChange={setThemeKey} />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}
