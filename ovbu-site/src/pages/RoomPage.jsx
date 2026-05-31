import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)
const ROOMS = ['A101', 'A102', 'B201', 'B202', 'C301']

function timeToPercent(time) {
  const [h, m] = time.split(':').map(Number)
  return ((h - 8) * 60 + m) / (13 * 60) * 100
}

function Block({ booking, onClick }) {
  const left = timeToPercent(booking.start_time)
  const width = timeToPercent(booking.end_time) - left
  return (
    <div
      onClick={() => onClick(booking)}
      style={{
        position: 'absolute',
        left: left + '%',
        width: width + '%',
        top: 4, bottom: 4,
        background: 'rgba(255,107,71,0.85)',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        padding: '0 8px',
        fontSize: 12, fontWeight: 700, color: 'white',
        overflow: 'hidden', whiteSpace: 'nowrap',
        border: '1px solid rgba(255,255,255,0.2)',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {booking.title || booking.organizer || '已预订'}
    </div>
  )
}

function AddModal({ room, onClose, onSaved }) {
  const [form, setForm] = useState({
    start_time: '09:00', end_time: '10:00',
    title: '', organizer: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('rooms').insert({
      room_no: room,
      date: today,
      ...form,
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1A3A55', borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.15)',
        padding: 32, width: 360,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>
          📅 录入 {room} 会议
        </h3>

        {[
          { label: '会议标题', key: 'title', type: 'text', placeholder: '例：产品周会' },
          { label: '组织者', key: 'organizer', type: 'text', placeholder: '姓名' },
          { label: '开始时间', key: 'start_time', type: 'time' },
          { label: '结束时间', key: 'end_time', type: 'time' },
          { label: '备注', key: 'notes', type: 'text', placeholder: '可选' },
        ].map(f => (
          <div key={f.key}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>{f.label}</div>
            <input
              type={f.type}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, color: 'white', fontSize: 14,
              }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: 14,
          }}>取消</button>
          <button onClick={save} disabled={saving} style={{
            flex: 2, padding: 12, borderRadius: 12,
            background: '#FF6B47', color: 'white',
            fontSize: 14, fontWeight: 700,
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '保存中...' : '保存 ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoomPage() {
  const [bookings, setBookings] = useState([])
  const [addModal, setAddModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('date', today)
    setBookings(data || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('rooms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const now = new Date()
  const nowPercent = ((now.getHours() - 8) * 60 + now.getMinutes()) / (13 * 60) * 100

  return (
    <div className="float-in" style={{ padding: '24px 0 48px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'white', fontWeight: 800, fontSize: 22 }}>🏢 今日会议室</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          {today} · 点击空白区域录入会议
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Hour labels */}
        <div style={{ display: 'flex', paddingLeft: 80, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {HOURS.map(h => (
            <div key={h} style={{
              flex: 1, textAlign: 'center',
              color: 'rgba(255,255,255,0.3)', fontSize: 11,
              padding: '8px 0',
            }}>
              {h}:00
            </div>
          ))}
        </div>

        {/* Room rows */}
        {ROOMS.map(room => {
          const roomBookings = bookings.filter(b => b.room_no === room)
          return (
            <div key={room} style={{
              display: 'flex', alignItems: 'stretch',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              minHeight: 48,
            }}>
              <div style={{
                width: 80, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}>
                {room}
              </div>
              <div
                style={{ flex: 1, position: 'relative', cursor: 'pointer' }}
                onClick={() => setAddModal(room)}
              >
                {/* Grid lines */}
                {HOURS.map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: (i / 13 * 100) + '%',
                    top: 0, bottom: 0, width: 1,
                    background: 'rgba(255,255,255,0.04)',
                  }} />
                ))}
                {/* Now line */}
                {nowPercent > 0 && nowPercent < 100 && (
                  <div style={{
                    position: 'absolute', left: nowPercent + '%',
                    top: 0, bottom: 0, width: 2,
                    background: '#FF6B47', opacity: 0.8,
                    zIndex: 5,
                  }} />
                )}
                {/* Booking blocks */}
                {roomBookings.map(b => (
                  <Block key={b.id} booking={b} onClick={b => { setDetail(b); }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#FF6B47', borderRadius: 3 }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>已预订</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 2, height: 14, background: '#FF6B47' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>当前时间</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>点击行空白处可录入</span>
      </div>

      {addModal && (
        <AddModal
          room={addModal}
          onClose={() => setAddModal(null)}
          onSaved={load}
        />
      )}

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1A3A55', borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.15)',
            padding: 32, width: 320,
          }}>
            <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
              📋 {detail.title || '会议详情'}
            </h3>
            {[
              ['会议室', detail.room_no],
              ['时间', detail.start_time + ' - ' + detail.end_time],
              ['组织者', detail.organizer],
              ['备注', detail.notes],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{k}</span>
                <div style={{ color: 'white', fontSize: 14, marginTop: 2 }}>{v}</div>
              </div>
            ))}
            <button onClick={() => setDetail(null)} style={{
              width: '100%', marginTop: 16, padding: 12,
              borderRadius: 12, background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)', fontSize: 14,
            }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}
