import React from 'react'

function PlaceholderPage({ icon, title, desc, t }) {
  return (
    <div style={{ padding: '32px 0' }}>
      <div style={{
        background: t ? t.cardBg : 'rgba(255,255,255,0.5)',
        borderRadius: 24,
        border: '1px solid ' + (t ? t.cardBorder : 'rgba(255,255,255,0.7)'),
        padding: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 400, flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 52 }}>{icon}</span>
        <h2 style={{ color: t ? t.text : '#064E3B', fontWeight: 800, fontSize: 22 }}>{title}</h2>
        <p style={{ color: t ? t.textSub : '#047857', fontSize: 14, opacity: 0.7 }}>{desc}</p>
      </div>
    </div>
  )
}

export function BookingPage({ t }) {
  return <PlaceholderPage icon="📅" title="客房预约" desc="特殊预约问卷 · 即将上线" t={t} />
}
