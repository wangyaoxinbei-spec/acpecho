import React, { useState, useEffect } from 'react'
import DanmakuInput from './DanmakuInput'

export default function TopBar({ username, t, mobile }) {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [greeting, setGreeting] = useState('HELLO!')
  const [weather, setWeather] = useState({ temp: '--', text: '同步中...' })

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
      setDateStr(`${now.getMonth() + 1}月${now.getDate()}日`)
      const hour = now.getHours()
      if (hour < 12) setGreeting('GOOD MORNING')
      else if (hour < 18) setGreeting('HELLO')
      else setGreeting('GOOD EVENING')
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://wttr.in/?format=j1')
        const data = await res.json()
        if (data?.current_condition?.[0]) {
          const c = data.current_condition[0]
          const map = { 'Sunny':'晴','Clear':'晴','Partly cloudy':'多云','Cloudy':'阴','Overcast':'阴','Light rain':'小雨','Heavy rain':'大雨' }
          setWeather({ temp: c.temp_C + '°C', text: map[c.weatherDesc[0].value] || c.weatherDesc[0].value })
        }
      } catch { setWeather({ temp: '24°C', text: '明朗' }) }
    }
    fetchWeather()
    return () => clearInterval(timer)
  }, [])

  if (mobile) {
    return (
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: t.greeting }}>
            {greeting}{username ? `, ${username}!` : '!'}
          </div>
          <div style={{ fontSize: 11, color: t.textSub, marginTop: 1 }}>
            {dateStr} · 🌤 {weather.temp}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <DanmakuInput username={username} t={t} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 32px 12px 32px', display: 'flex', alignItems: 'center', gap: '24px', boxSizing: 'border-box' }}>
      <div style={{ flexShrink: 0 }}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: t.greeting, margin: 0, letterSpacing: '-0.02em' }}>
          {greeting}{username ? `, ${username.toUpperCase()}!` : '!'}
        </h2>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <DanmakuInput username={username} t={t} />
      </div>
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px',
        background: t.pillBg, padding: '8px 16px', borderRadius: '14px',
        fontSize: '13px', fontWeight: '700', color: t.text,
        border: '1px solid ' + t.pillBorder, transition: 'all 0.4s ease',
      }}>
        <span>📅 {dateStr}</span>
        <span style={{ color: t.textSub }}>{timeStr}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span style={{ color: t.textSub }}>🌤 {weather.text} · {weather.temp}</span>
      </div>
    </div>
  )
}
