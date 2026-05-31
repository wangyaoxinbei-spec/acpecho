import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function MeetingPage({ t }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewTab, setViewTab] = useState('day');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchMeetings = async () => {
      const { data } = await supabase.from('meetings').select('*').order('time_slot', { ascending: true });
      if (data) setMeetings(data);
    };
    fetchMeetings();
    const channel = supabase.channel('public:meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => fetchMeetings())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // 全周总览时间段定位
  const calculatePosition = (timeSlot) => {
    try {
      const [start, end] = timeSlot.split('-');
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const baseHour = 8, totalHours = 12;
      const startPos = ((startH - baseHour) * 60 + startM) / (totalHours * 60) * 100;
      const endPos = ((endH - baseHour) * 60 + endM) / (totalHours * 60) * 100;
      return { left: `${Math.max(0, startPos)}%`, width: `${Math.max(12, endPos - startPos)}%` };
    } catch { return { left: '0%', width: '20%' }; }
  };

  // 导入日程 CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const toInsert = [];

      // 智能格式化日期函数
      const normalizeDate = (rawDate) => {
        if (!rawDate) return '';
        let clean = rawDate.trim().replace(/\//g, '-');
        const parts = clean.split('-');
        let year = new Date().getFullYear();
        let month = '';
        let day = '';

        if (parts.length === 2) {
          month = parts[0]; day = parts[1];
        } else if (parts.length === 3) {
          year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
          month = parts[1]; day = parts[2];
        } else {
          return clean;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = line.replace(/，/g, ',').split(',');
        if (row.length >= 3) {
          toInsert.push({
            date: normalizeDate(row[0]),
            room_number: row[1].trim(),
            time_slot: row[2].trim(),
            // 💡 修正 1：如果表格第四列为空，直接填空字符串，不再赋予任何兜底字
            organizer: row[3] ? row[3].trim() : '' 
          });
        }
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from('meetings').insert(toInsert);
        if (!error) alert(`🎉 成功同步 ${toInsert.length} 条日程！`);
        else alert('错误: ' + error.message);
      }
      setLoading(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const dayMeetings = meetings.filter(m => m.date === today);
  const weekGrouped = meetings.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const tabActive   = { padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer', background: t.cardBg, color: t.activeText, transition: 'all 0.2s', boxShadow: t.dark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)' }
  const tabInactive = { padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer', background: 'transparent', color: t.text, transition: 'all 0.2s' }

  return (
    <div style={{ color: t.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
        <div style={{ display: 'flex', gap: '4px', background: t.inputBg, padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setViewTab('day')}  style={viewTab === 'day'  ? tabActive : tabInactive}>当天日程</button>
          <button onClick={() => setViewTab('week')} style={viewTab === 'week' ? tabActive : tabInactive}>全周总览</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: t.pillBg, padding: '6px 14px', borderRadius: '12px', border: '1px solid ' + t.pillBorder }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: t.text }}>{loading ? '处理中...' : '📥 导入日程 CSV:'}</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} disabled={loading} style={{ fontSize: '12px', width: '160px', color: t.textSub, cursor: 'pointer' }} />
        </div>
      </div>

      {/* ────────────────── 当天视图 ────────────────── */}
      {viewTab === 'day' && (
        <div style={{ position: 'relative', padding: '20px 0', minHeight: '400px' }}>
          {dayMeetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: t.textSub, opacity: 0.5, fontSize: '14px', fontWeight: '600' }}>
              ☕️ 比奇堡今日空闲，暂无任何会议登记
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: t.text, opacity: 0.2, transform: 'translateX(-50%)', zIndex: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative', zIndex: 2 }}>
                {dayMeetings.map((m, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div key={m.id} style={{ display: 'flex', width: '100%', alignItems: 'center', flexDirection: isLeft ? 'row' : 'row-reverse' }}>
                      <div style={{ width: '50%', display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start', paddingRight: isLeft ? '40px' : '0', paddingLeft: isLeft ? '0' : '40px', boxSizing: 'border-box' }}>
                        <div style={{ background: t.cardBg, border: '1px solid ' + t.cardBorder, borderRadius: '16px', padding: '18px 24px', width: '280px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: t.activeText, letterSpacing: '0.05em', marginBottom: '4px' }}>ROOM UNIT</div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: t.text, marginBottom: '6px' }}>{m.room_number}</div>
                          
                          {/* 💡 修正 2：用逻辑与 && 判断。只有当表格填了发起人（m.organizer 不为空）时，才渲染该行。没填时卡片底部直接隐形 */}
                          {m.organizer && (
                            <div style={{ fontSize: '13px', color: t.textSub, fontWeight: '600' }}>
                              👤 发起: {m.organizer}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', borderRadius: '50%', background: t.cardBg, border: '3px solid ' + t.text, zIndex: 3 }} />
                      <div style={{ width: '50%', paddingLeft: isLeft ? '40px' : '0', paddingRight: isLeft ? '0' : '40px', textAlign: isLeft ? 'left' : 'right', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: t.text }}>{m.time_slot}</div>
                        <div style={{ fontSize: '12px', color: t.textSub, fontWeight: '600', marginTop: '2px' }}>Today Schedule</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── 全周视图 ────────────────── */}
      {viewTab === 'week' && (
        <div style={{ background: t.cardBg, padding: '28px', borderRadius: '24px', border: '1px solid ' + t.cardBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: t.textSub, fontSize: '12px', marginBottom: '20px', paddingLeft: '110px', paddingRight: '10px', fontWeight: '700' }}>
            <span>08:00</span><span>11:00</span><span>14:00</span><span>17:00</span><span>20:00</span>
          </div>
          {Object.keys(weekGrouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: t.textSub, opacity: 0.4, fontSize: '13px', fontWeight: '600' }}>📅 本周内暂未同步任何日程 data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.keys(weekGrouped).sort().map((dateStr) => (
                <div key={dateStr} style={{ display: 'flex', alignItems: 'center', minHeight: '40px' }}>
                  <div style={{ width: '100px', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: dateStr === today ? t.activeText : t.text }}>
                      {dateStr === today ? '📍 今天' : dateStr.substring(5)}
                    </span>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '36px', background: t.inputBg, borderRadius: '12px', border: '1px solid ' + t.inputBorder }}>
                    {weekGrouped[dateStr].map((m, idx) => {
                      const { left, width } = calculatePosition(m.time_slot);
                      return (
                        <div key={m.id} style={{
                          position: 'absolute', left, width,
                          backgroundColor: t.cardBg, color: t.text,
                          height: '100%', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', padding: '0 12px',
                          fontSize: '11px', fontWeight: '800',
                          border: '1px solid ' + t.cardBorder,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          ⏱️ {m.time_slot}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}