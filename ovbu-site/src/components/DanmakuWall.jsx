import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function DanmakuWall() {
  const [danmakus, setDanmakus] = useState([]);
  const poolRef = useRef([]);
  const activeRef = useRef([]);
  const counterRef = useRef(0);

  const launch = (d) => {
    const id = counterRef.current++;
    const top = Math.random() * 65 + 8;
    const duration = 10 + Math.random() * 6;
    const item = { ...d, _id: id, top, duration };
    activeRef.current = [...activeRef.current, item];
    setDanmakus([...activeRef.current]);
    setTimeout(() => {
      activeRef.current = activeRef.current.filter(i => i._id !== id);
      setDanmakus([...activeRef.current]);
      poolRef.current.push(d);
      scheduleNext();
    }, duration * 1000);
  };

  const scheduleNext = () => {
    if (poolRef.current.length === 0) return;
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      if (poolRef.current.length === 0) return;
      const idx = Math.floor(Math.random() * poolRef.current.length);
      const next = poolRef.current.splice(idx, 1)[0];
      launch(next);
    }, delay);
  };

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('danmaku').select('*')
        .order('created_at', { ascending: false }).limit(20);
      if (data && data.length > 0) {
        poolRef.current = [...data];
        const initialCount = Math.min(4, data.length);
        for (let i = 0; i < initialCount; i++) {
          setTimeout(() => {
            if (poolRef.current.length > 0) {
              const item = poolRef.current.shift();
              launch(item);
            }
          }, i * 800);
        }
      }
    };
    fetchRecent();

    const channel = supabase
      .channel('public:danmaku-wall')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'danmaku' }, (payload) => {
        launch(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {danmakus.map((d) => (
        <div key={d._id} style={{
          position: 'absolute', top: `${d.top}%`,
          whiteSpace: 'nowrap', color: d.color || '#fff',
          fontSize: '15px', fontWeight: 'bold',
          textShadow: '1px 1px 4px rgba(0,0,0,0.9)',
          animation: `marquee ${d.duration}s linear forwards`,
          padding: '5px 12px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '20px',
          backdropFilter: 'blur(2px)',
        }}>
          {d.text}
        </div>
      ))}
      <style>{`@keyframes marquee { from { transform: translateX(100vw); } to { transform: translateX(-120%); } }`}</style>
    </div>
  );
}
