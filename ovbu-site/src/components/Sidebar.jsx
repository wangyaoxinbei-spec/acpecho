import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar({ t }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { name: '今日会议室', path: '/',         icon: '🍍' },
    { name: '蟹黄堡跟随', path: '/lunch',    icon: '🍔' },
    { name: '客房预约',   path: '/booking',  icon: '📅' },
    { name: '水母寄信',   path: '/feedback', icon: '✉️' },
    { name: '船长设置',   path: '/settings', icon: '⚓️' },
  ]

  return (
    <div style={{
      width: '240px',
      background: t.sidebarBg,
      borderRight: '1px solid ' + t.sidebarBorder,
      padding: '40px 16px',
      display: 'flex', flexDirection: 'column', gap: '40px',
      flexShrink: 0,
      transition: 'all 0.4s ease',
    }}>
      <div style={{ paddingLeft: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: t.text, letterSpacing: '-0.03em', margin: 0 }}>
          BikiniBottom
        </h1>
        <span style={{ fontSize: '11px', color: t.textSub, fontWeight: '600' }}>
          Workspace v1.2
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '16px',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                fontSize: '14px', fontWeight: isActive ? '800' : '600',
                background: isActive ? t.activeBg : 'transparent',
                color: isActive ? t.activeText : t.text,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.name}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
