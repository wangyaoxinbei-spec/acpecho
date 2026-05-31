import { useState, useEffect } from 'react'

const GREETINGS = [
  'Hi！今天也要元气满满 🌟',
  '嗨～ 海绵宝宝说：Ready！✨',
  '下午好，派大星在睡觉，你别学他 😄',
  '嗨！今天的会议室等你来征服 🏆',
  '章鱼哥今天也不在状态，但你可以！💪',
  '嘿，Ovbu 在线，一切都会好的 🫧',
]

export function useClock() {
  const [now, setNow] = useState(new Date())
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = n => String(n).padStart(2, '0')
  const days = ['日', '一', '二', '三', '四', '五', '六']

  return {
    greeting,
    date: `${now.getMonth() + 1}月${now.getDate()}日 周${days[now.getDay()]}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
  }
}