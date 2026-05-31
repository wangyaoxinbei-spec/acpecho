import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const BOTTLE_EMOJIS = ['🫙', '🍶', '🧴', '🫗', '🫧']
const BOTTLE_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB923C']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

function BottleItem({ bottle, onClick }) {
  return (
    <div
      onClick={() => onClick(bottle)}
      style={{
        position: 'absolute',
        left: bottle.x + '%',
        top: bottle.y + '%',
        fontSize: bottle.size + 'px',
        transform: `rotate(${bottle.rotate}deg)`,
        cursor: 'pointer',
        filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.15))`,
        transition: 'transform 0.2s, filter 0.2s',
        animation: `floatBottle ${bottle.floatDuration}s ease-in-out ${bottle.floatDelay}s infinite`,
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = `rotate(${bottle.rotate}deg) scale(1.3)`
        e.currentTarget.style.filter = `drop-shadow(0 8px 16px rgba(0,0,0,0.25))`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = `rotate(${bottle.rotate}deg) scale(1)`
        e.currentTarget.style.filter = `drop-shadow(0 4px 8px rgba(0,0,0,0.15))`
      }}
    >
      {bottle.emoji}
    </div>
  )
}

function MessageModal({ message, t, onClose }) {
  if (!message) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.dark ? '#1A2A3A' : 'rgba(255,255,255,0.97)',
          borderRadius: 28, padding: '36px 32px',
          width: '100%', maxWidth: 400,
          border: '1px solid ' + t.cardBorder,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 20,
          animation: 'popIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🫙</div>
          <div style={{ color: t.textSub, fontSize: 12, fontWeight: 600 }}>
            捡到了一封漂流信
          </div>
        </div>

        <div style={{
          background: t.inputBg,
          borderRadius: 16, padding: '20px 24px',
          border: '1px solid ' + t.inputBorder,
          minHeight: 100,
        }}>
          <p style={{
            color: t.text, fontSize: 16, lineHeight: 1.8,
            margin: 0, fontWeight: 500,
            wordBreak: 'break-all',
          }}>
            {message.content}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: t.textSub, fontSize: 12 }}>
            {new Date(message.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 999,
              background: t.btnPrimary, color: 'white',
              fontSize: 14, fontWeight: 700,
            }}
          >
            放回大海 🌊
          </button>
        </div>
      </div>
    </div>
  )
}

export function FeedbackPage({ t }) {
  const [messages, setMessages] = useState([])
  const [bottles, setBottles] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [openMsg, setOpenMsg] = useState(null)
  const [sent, setSent] = useState(false)

  const buildBottles = useCallback((msgs) => {
    const list = msgs.map((m, i) => ({
      id: m.id,
      msgId: m.id,
      x: randomBetween(5, 85),
      y: randomBetween(10, 75),
      rotate: randomBetween(-30, 30),
      size: randomBetween(28, 44),
      emoji: BOTTLE_EMOJIS[i % BOTTLE_EMOJIS.length],
      color: BOTTLE_COLORS[i % BOTTLE_COLORS.length],
      floatDuration: randomBetween(3, 6),
      floatDelay: randomBetween(0, 3),
    }))
    setBottles(list)
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    const msgs = data || []
    setMessages(msgs)
    buildBottles(msgs)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('feedback-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleBottleClick = () => {
    if (messages.length === 0) return
    const random = messages[Math.floor(Math.random() * messages.length)]
    setOpenMsg(random)
  }

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await supabase.from('feedback').insert({ content: text.trim(), author: null })
    setText('')
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <div style={{ padding: '8px 0 48px' }}>
      <h2 style={{ color: t.text, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>✉️ 水母寄信</h2>
      <p style={{ color: t.textSub, fontSize: 13, opacity: 0.8, marginBottom: 24 }}>
        匿名漂流瓶 · 点击瓶子捡起一封信
      </p>

      {/* 投递区 */}
      <div style={{
        background: t.cardBg, borderRadius: 20,
        border: '1px solid ' + t.cardBorder,
        padding: 20, marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-end',
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="对网站、对同事、对世界说点什么…匿名投入大海"
          maxLength={200}
          rows={3}
          style={{
            flex: 1, background: t.inputBg,
            border: '1px solid ' + t.inputBorder,
            borderRadius: 12, padding: '12px 14px',
            color: t.inputColor, fontSize: 14,
            resize: 'none', lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <span style={{ color: t.textSub, fontSize: 11 }}>{text.length}/200</span>
          <button
            onClick={submit}
            disabled={sending || !text.trim()}
            style={{
              padding: '10px 20px', borderRadius: 12,
              background: sent ? '#10B981' : t.btnPrimary,
              color: 'white', fontSize: 14, fontWeight: 700,
              opacity: !text.trim() ? 0.5 : 1,
              transition: 'background 0.3s', whiteSpace: 'nowrap',
            }}
          >
            {sent ? '✓ 已投出！' : '投入大海 🌊'}
          </button>
        </div>
      </div>

      {/* 海洋漂流区 */}
      <div style={{
        position: 'relative',
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        background: t.dark
          ? 'linear-gradient(180deg, rgba(10,40,80,0.5) 0%, rgba(5,20,50,0.7) 100%)'
          : 'linear-gradient(180deg, rgba(186,230,255,0.4) 0%, rgba(125,200,255,0.2) 100%)',
        border: '1px solid ' + t.cardBorder,
      }}>
        {/* 波浪装饰 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: t.dark
            ? 'rgba(10,40,80,0.4)'
            : 'rgba(147,210,255,0.25)',
          borderRadius: '50% 50% 0 0 / 20px',
        }} />
        <div style={{
          position: 'absolute', bottom: 20, left: '-5%', right: '-5%', height: 40,
          background: t.dark
            ? 'rgba(10,40,80,0.3)'
            : 'rgba(147,210,255,0.2)',
          borderRadius: '50%',
        }} />

        {messages.length === 0 ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: t.textSub, opacity: 0.5,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌊</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>大海还很平静</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>投出第一个漂流瓶吧</div>
          </div>
        ) : (
          <>
            {bottles.map(b => (
              <BottleItem key={b.id} bottle={b} onClick={handleBottleClick} />
            ))}
            <div style={{
              position: 'absolute', bottom: 12, right: 16,
              color: t.textSub, fontSize: 11, opacity: 0.6,
            }}>
              共 {messages.length} 个漂流瓶 · 点击任意瓶子捡起
            </div>
          </>
        )}
      </div>

      <MessageModal message={openMsg} t={t} onClose={() => setOpenMsg(null)} />

      <style>{`
        @keyframes floatBottle {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-8px) rotate(var(--r, 0deg)); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
