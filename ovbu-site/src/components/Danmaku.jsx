import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = ['#FF6B47', '#1A7FBF', '#F5E6C8', '#FFFFFF', '#FFD700', '#98F5FF']
const TRACKS = [8, 18, 28, 38, 48]

export default function Danmaku() {
  const [items, setItems] = useState([])
  const counterRef = useRef(0)

  const addDanmaku = (text, color) => {
    const id = counterRef.current++
    const track = TRACKS[id % TRACKS.length]
    const duration = 8 + Math.random() * 6
    setItems(prev => [...prev.slice(-20), { id, text, color, track, duration }])
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
    }, duration * 1000 + 500)
  }

  useEffect(() => {
    const channel = supabase
      .channel('danmaku')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'danmaku',
      }, payload => {
        addDanmaku(payload.new.text, payload.new.color || COLORS[0])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden',
    }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            top: item.track + '%',
            whiteSpace: 'nowrap',
            fontSize: '15px',
            fontWeight: 600,
            color: item.color,
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            animation: 'danmaku ' + item.duration + 's linear forwards',
            letterSpacing: '0.02em',
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}

export { COLORS }
