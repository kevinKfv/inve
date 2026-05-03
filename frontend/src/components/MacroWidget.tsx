'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { api } from '@/lib/api';

interface MacroItem {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  status: 'up' | 'down';
  error?: string;
}

export default function MacroWidget() {
  const [data, setData] = useState<MacroItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMacro() {
      try {
        const json = await api.macro();
        if (json.data) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Error fetching macro data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMacro();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <Activity size={16} /> Cargando datos macroeconómicos...
        </div>
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 20, padding: '16px' }}>
      <div className="section-title" style={{ marginBottom: 16 }}>
        <Activity size={16} /> Panel Macroeconómico
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '12px' 
      }}>
        {data.map(item => {
          if (item.error) return null;
          const isUp = item.status === 'up';
          return (
            <div key={item.ticker} style={{
              background: 'var(--bg-card-hover)',
              padding: '10px 12px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>
                  {item.price}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: isUp ? 'var(--green)' : 'var(--red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {item.change_pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
