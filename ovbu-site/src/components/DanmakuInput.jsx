import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { COLORS } from './Danmaku'

export default function DanmakuInput({ username, t }) {
  const [text, setText] = useState('')
  const [color, setColor] = useState(COLORS[1])
  const [sending, setSending] = useState(false)

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    await supabase.from('danmaku').insert({
      text: username ? username + '：' + trimmed : trimmed,
      color,
    })
    setText('')
    setSending(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: t.inputBg,
      backdropFilter: 'blur(12px)',
      borderRadius: 999,
      padding: '6px 6px 6px 16px',
      border: '1px solid ' + t.inputBorder,
      transition: 'all 0.4s ease',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {COLORS.map(c => (
          <div key={c} onClick={() => setColor(c)} style={{
            width: 14, height: 14, borderRadius: '50%', background: c,
            cursor: 'pointer',
            border: color === c ? '2px solid ' + t.text : '2px solid transparent',
            transition: 'border 0.15s',
          }} />
        ))}
      </div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="说点什么飘上去"
        maxLength={40}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: t.inputColor, fontSize: 14, minWidth: 0,
        }}
      />
      <button onClick={send} disabled={sending || !text.trim()} style={{
        background: t.btnPrimary, color: '#fff', borderRadius: 999,
        padding: '6px 16px', fontSize: 13, fontWeight: 700,
        opacity: sending || !text.trim() ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}>
        发射
      </button>
    </div>
  )
}
