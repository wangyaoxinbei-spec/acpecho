import { useState, useEffect } from 'react'

export function useWeather() {
  const [weather, setWeather] = useState({ temp: '--', desc: '--', icon: '🌤' })

  useEffect(() => {
    const key = import.meta.env.VITE_QWEATHER_KEY
    if (!key || key.includes('你的')) return

    fetch(`https://devapi.qweather.com/v7/weather/now?location=101020100&key=${key}`)
      .then(r => r.json())
      .then(data => {
        if (data.code === '200') {
          const icons = {
            '100': '☀️', '101': '🌤', '102': '⛅', '103': '🌥', '104': '☁️',
            '300': '🌦', '301': '🌧', '302': '⛈', '400': '🌨', '401': '❄️',
          }
          const code = data.now.icon
          setWeather({
            temp: data.now.temp,
            desc: data.now.text,
            icon: icons[code] || '🌡',
          })
        }
      })
      .catch(() => {})
  }, [])

  return weather
}