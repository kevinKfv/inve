'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, MessageCircle } from 'lucide-react';

interface SentimentData {
  score: number;
  label: string;
  news_count: number;
  articles: any[];
}

export default function SentimentGauge({ ticker }: { ticker: string }) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSentiment() {
      try {
        const json = await api.sentiment(ticker);
        setData(json);
      } catch (e) {
        console.error('Error fetching sentiment', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSentiment();
  }, [ticker]);

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" /></div>;
  if (!data) return null;

  const color = data.label === 'BULLISH' ? 'var(--green)' : data.label === 'BEARISH' ? 'var(--red)' : 'var(--yellow)';
  const pct = ((data.score + 1) / 2) * 100;

  return (
    <div className="card">
      <div className="section-title"><MessageCircle size={14} style={{ display: 'inline', marginRight: 4 }} /> Sentimiento de Noticias</div>
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color }}>{data.label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score VADER: {data.score.toFixed(2)}</div>
      </div>
      
      {/* Gauge bar */}
      <div style={{ position: 'relative', height: 8, background: 'var(--bg-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ 
          position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, 
          background: color, borderRadius: 4, transition: 'width 1s ease-out'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Extremo Bearish</span>
        <span>Neutral</span>
        <span>Extremo Bullish</span>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
        Basado en {data.news_count} artículos recientes.
      </div>
    </div>
  );
}
