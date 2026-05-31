import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

async function requestNotifyPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function notify(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

function CreateModal({ username, t, onClose, onSaved }) {
  const [form, setForm] = useState({ restaurant: '', time_slot: '12:00-13:00', max_seats: 5 })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.restaurant.trim()) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('lunch_groups').insert({
      organizer: username || '匿名',
      restaurant: form.restaurant,
      time_slot: form.time_slot,
      max_seats: form.max_seats,
      date: today, followers: [], is_open: true,
    })
    setSaving(false); onSaved(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.dark ? '#1A2A3A' : 'rgba(255,255,255,0.97)', borderRadius: 24, border: '1px solid ' + t.cardBorder, padding: 32, width: 360, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>🍱 发起午餐组队</h3>
        {[
          { label: '餐厅名称', key: 'restaurant', type: 'text', placeholder: '例：楼下沙县' },
          { label: '时间段', key: 'time_slot', type: 'text', placeholder: '例：12:00-13:00' },
        ].map(f => (
          <div key={f.key}>
            <div style={{ color: t.textSub, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', background: t.inputBg, border: '1px solid ' + t.inputBorder, borderRadius: 10, color: t.inputColor, fontSize: 14 }} />
          </div>
        ))}
        <div>
          <div style={{ color: t.textSub, fontSize: 12, marginBottom: 6, fontWeight: 600 }}>最多人数</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2,3,4,5,6].map(n => (
              <button key={n} onClick={() => setForm(prev => ({ ...prev, max_seats: n }))} style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: form.max_seats === n ? t.btnPrimary : t.inputBg, border: '1px solid ' + (form.max_seats === n ? t.btnPrimary : t.inputBorder), color: form.max_seats === n ? 'white' : t.text, fontSize: 14, fontWeight: 700 }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: t.inputBg, color: t.textSub, fontSize: 14, fontWeight: 600 }}>取消</button>
          <button onClick={save} disabled={saving || !form.restaurant.trim()} style={{ flex: 2, padding: 12, borderRadius: 12, background: t.btnPrimary, color: 'white', fontSize: 14, fontWeight: 700, opacity: saving || !form.restaurant.trim() ? 0.6 : 1 }}>
            {saving ? '发布中...' : '发布组队 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GroupCard({ group, username, t, onFollow, onClose }) {
  const isFull = group.followers.length >= group.max_seats - 1
  const isFollowing = group.followers.includes(username)
  const isOrganizer = group.organizer === username

  return (
    <div style={{ background: t.cardBg, borderRadius: 20, border: '1px solid ' + t.cardBorder, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 17 }}>🍜 {group.restaurant}</div>
          <div style={{ color: t.textSub, fontSize: 13, marginTop: 4 }}>{group.time_slot} · 发起人：{group.organizer}</div>
        </div>
        <div style={{ background: isFull ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)', border: '1px solid ' + (isFull ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)'), borderRadius: 999, padding: '4px 12px', color: isFull ? '#EF4444' : '#10B981', fontSize: 12, fontWeight: 700 }}>
          {isFull ? '已满' : '招募中'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: t.dark ? 'rgba(255,107,71,0.2)' : 'rgba(255,107,71,0.12)', border: '1px solid rgba(255,107,71,0.3)', borderRadius: 999, padding: '4px 12px', color: t.dark ? '#FF8866' : '#CC4422', fontSize: 13, fontWeight: 700 }}>
          👑 {group.organizer}
        </div>
        {group.followers.map(f => (
          <div key={f} style={{ background: t.inputBg, borderRadius: 999, padding: '4px 12px', color: t.text, fontSize: 13 }}>{f}</div>
        ))}
        {Array.from({ length: Math.max(0, group.max_seats - 1 - group.followers.length) }).map((_, i) => (
          <div key={i} style={{ background: 'transparent', border: '1px dashed ' + t.inputBorder, borderRadius: 999, padding: '4px 12px', color: t.textSub, fontSize: 13, opacity: 0.5 }}>空位</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!isOrganizer && !isFollowing && !isFull && (
          <button onClick={() => onFollow(group)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: t.btnPrimary, color: 'white', fontSize: 14, fontWeight: 700 }}>一键跟随 🏃</button>
        )}
        {isFollowing && (
          <div style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>✓ 已跟随</div>
        )}
        {isOrganizer && (
          <button onClick={() => onClose(group)} style={{ padding: '10px 16px', borderRadius: 12, background: t.inputBg, color: t.textSub, fontSize: 13 }}>结束组队</button>
        )}
      </div>
    </div>
  )
}

export function LunchPage({ t }) {
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [notifyOn, setNotifyOn] = useState(Notification?.permission === 'granted')
  const prevGroupsRef = useRef([])
  const username = localStorage.getItem('ovbu_username') || '匿名'
  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    const { data } = await supabase.from('lunch_groups').select('*').eq('date', today).eq('is_open', true).order('created_at', { ascending: false })
    const newGroups = data || []

    // 检查是否有人加入了我发起的组队
    if (prevGroupsRef.current.length > 0 && username !== '匿名') {
      newGroups.forEach(ng => {
        if (ng.organizer === username) {
          const prev = prevGroupsRef.current.find(p => p.id === ng.id)
          if (prev && ng.followers.length > prev.followers.length) {
            const newFollower = ng.followers[ng.followers.length - 1]
            notify('🍱 有人加入你的组队！', `${newFollower} 跟随了你去 ${ng.restaurant}`)
          }
        }
      })
    }
    prevGroupsRef.current = newGroups
    setGroups(newGroups)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('lunch-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lunch_groups' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const enableNotify = async () => {
    const ok = await requestNotifyPermission()
    setNotifyOn(ok)
  }

  const follow = async (group) => {
    if (!username || username === '匿名') { alert('请先在船长设置里填写你的姓名！'); return }
    await supabase.from('lunch_groups').update({ followers: [...group.followers, username] }).eq('id', group.id)
  }

  const closeGroup = async (group) => {
    await supabase.from('lunch_groups').update({ is_open: false }).eq('id', group.id)
  }

  return (
    <div style={{ padding: '8px 0 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: t.text, fontWeight: 800, fontSize: 22 }}>🍱 午餐跟随</h2>
          <p style={{ color: t.textSub, fontSize: 13, marginTop: 4, opacity: 0.8 }}>今日组队 · 实时同步</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!notifyOn && (
            <button onClick={enableNotify} style={{ padding: '10px 16px', borderRadius: 999, background: t.inputBg, color: t.textSub, fontSize: 13, fontWeight: 600, border: '1px solid ' + t.inputBorder }}>
              🔔 开启通知
            </button>
          )}
          {notifyOn && (
            <div style={{ padding: '10px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 13, fontWeight: 600 }}>
              🔔 通知已开启
            </div>
          )}
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', borderRadius: 999, background: t.btnPrimary, color: 'white', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            + 我要组队
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: t.cardBg, borderRadius: 20, border: '1px dashed ' + t.cardBorder, padding: 48, textAlign: 'center', color: t.textSub, fontSize: 15 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽</div>
          <div style={{ fontWeight: 700 }}>今天还没有人发起组队</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>点击右上角发起吧！</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(g => <GroupCard key={g.id} group={g} username={username} t={t} onFollow={follow} onClose={closeGroup} />)}
        </div>
      )}
      {showCreate && <CreateModal username={username} t={t} onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  )
}
