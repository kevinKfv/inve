'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ForecastChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const res = await fetch(`${api.baseUrl}/asset/${ticker}/forecast?days=14`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Error fetching forecast', e);
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, [ticker]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;
  if (!data || data.error) return <div className="text-red">Error: {data?.error || 'No data'}</div>;

  const chartData = data.forecast.map((d: any) => ({
    date: d.date.substring(5), // MM-DD
    price: d.predicted_price
  }));

  const isUp = data.trend_pct >= 0;

  return (
    <div className="card">
      <div className="section-title"><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> Proyección a 14 días (IA)</div>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Precio Actual</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>${data.current_price.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Objetivo a 14d</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: isUp ? 'var(--green)' : 'var(--red)' }}>
            ${data.target_price.toFixed(2)} ({isUp ? '+' : ''}{data.trend_pct}%)
          </div>
        </div>
      </div>

      <div style={{ height: 200, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isUp ? 'var(--green)' : 'var(--red)'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin', 'auto']} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace' }}
            />
            <Area type="monotone" dataKey="price" stroke={isUp ? 'var(--green)' : 'var(--red)'} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
        ⚠️ Predicción generada con Gradient Boosting Regressor (Machine Learning). Resultados netamente educativos, no usar para operar.
      </p>
    </div>
  );
}
