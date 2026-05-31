import React, { useState } from 'react'
import { THEMES } from '../lib/theme'

const THEME_LIST = [
  { key: 'mint',   label: '比奇堡薄荷' },
  { key: 'ocean',  label: '深海蓝夜'   },
  { key: 'coral',  label: '珊瑚日落'   },
  { key: 'galaxy', label: '海绵宇宙'   },
]

export function SettingsPage({ t, onThemeChange }) {
  const [name, setName] = useState(localStorage.getItem('ovbu_username') || '')
  const [theme, setTheme] = useState(localStorage.getItem('ovbu_theme') || 'mint')
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem('ovbu_username', name.trim())
    localStorage.setItem('ovbu_theme', theme)
    onThemeChange(theme)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '8px 0 48px', maxWidth: 560 }}>
      <h2 style={{ color: t.text, fontWeight: 800, fontSize: 22, marginBottom: 8 }}>⚓️ 船长设置</h2>
      <p style={{ color: t.textSub, fontSize: 13, opacity: 0.7, marginBottom: 32 }}>个人偏好 · 本地保存</p>

      {/* 用户名 */}
      <div style={{
        background: t.cardBg, borderRadius: 20,
        border: '1px solid ' + t.cardBorder,
        padding: 24, marginBottom: 16,
      }}>
        <div style={{ color: t.text, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🧑 你的船员名称</div>
        <div style={{ color: t.textSub, fontSize: 12, opacity: 0.7, marginBottom: 14 }}>用于午餐跟随、弹幕署名等</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="输入你的名字，例如：海绵宝宝"
          maxLength={12}
          style={{
            width: '100%', padding: '12px 16px',
            background: t.inputBg, border: '1px solid ' + t.inputBorder,
            borderRadius: 12, color: t.inputColor,
            fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
          }}
        />
        {name && (
          <div style={{ marginTop: 10, fontSize: 13, color: t.textSub }}>
            预览：👋 HELLO, {name.toUpperCase()}!
          </div>
        )}
      </div>

      {/* 主题 */}
      <div style={{
        background: t.cardBg, borderRadius: 20,
        border: '1px solid ' + t.cardBorder,
        padding: 24, marginBottom: 24,
      }}>
        <div style={{ color: t.text, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🎨 背景主题</div>
        <div style={{ color: t.textSub, fontSize: 12, opacity: 0.7, marginBottom: 14 }}>选一个你喜欢的比奇堡风格</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {THEME_LIST.map(item => {
            const th = THEMES[item.key]
            return (
              <div
                key={item.key}
                onClick={() => setTheme(item.key)}
                style={{
                  borderRadius: 14, padding: '14px 16px',
                  background: th.bg,
                  border: theme === item.key ? '2.5px solid ' + th.text : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border 0.2s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: th.text }}>
                  {item.label}
                </span>
                {theme === item.key && <span style={{ color: th.text }}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={save}
        disabled={!name.trim()}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          fontSize: 15, fontWeight: 800,
          background: saved ? '#059669' : t.btnPrimary,
          color: 'white', opacity: !name.trim() ? 0.5 : 1,
          transition: 'background 0.3s',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        {saved ? '✓ 已保存！' : '保存设置'}
      </button>

      <div style={{ marginTop: 16, fontSize: 12, color: t.textSub, opacity: 0.5, textAlign: 'center' }}>
        设置保存在本地浏览器，不会上传到服务器
      </div>
    </div>
  )
}
