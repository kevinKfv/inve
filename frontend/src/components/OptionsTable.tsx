'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OptionsTable({ ticker }: { ticker: string }) {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chain, setChain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChain, setLoadingChain] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDates() {
      try {
        const json = await api.optionsDates(ticker);
        setDates(json.dates);
        if (json.dates.length > 0) {
          setSelectedDate(json.dates[0]);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDates();
  }, [ticker]);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchChain() {
      setLoadingChain(true);
      try {
        const json = await api.optionsChain(ticker, selectedDate);
        setChain(json);
      } catch (e) {
        console.error('Error fetching chain', e);
      } finally {
        setLoadingChain(false);
      }
    }
    fetchChain();
  }, [ticker, selectedDate]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="card text-red" style={{ textAlign: 'center' }}><AlertCircle size={20} style={{ marginBottom: 8 }} /><br/>{error}</div>;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Cadena de Opciones</div>
        <select 
          className="input" 
          style={{ width: 'auto', padding: '4px 8px', height: 'auto', fontSize: 12 }}
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        >
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loadingChain ? (
        <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
      ) : chain ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <div style={{ background: 'var(--bg-surface)' }}>
            <div style={{ padding: '8px 16px', background: 'var(--green-dim)', color: 'var(--green)', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>CALLS</div>
            <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                  <tr>
                    <th>Strike</th>
                    <th>Bid</th>
                    <th>Ask</th>
                    <th>Vol</th>
                    <th title="Delta">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.calls.slice(0, 20).map((c: any) => (
                    <tr key={c.contractSymbol} style={{ background: c.inTheMoney ? 'rgba(0, 255, 0, 0.05)' : 'transparent' }}>
                      <td className="mono" style={{ fontWeight: 700 }}>${c.strike}</td>
                      <td className="mono">{c.bid}</td>
                      <td className="mono">{c.ask}</td>
                      <td className="mono">{c.volume || 0}</td>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{c.delta?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-surface)' }}>
            <div style={{ padding: '8px 16px', background: 'var(--red-dim)', color: 'var(--red)', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>PUTS</div>
            <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                  <tr>
                    <th>Strike</th>
                    <th>Bid</th>
                    <th>Ask</th>
                    <th>Vol</th>
                    <th title="Delta">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.puts.slice(0, 20).map((p: any) => (
                    <tr key={p.contractSymbol} style={{ background: p.inTheMoney ? 'rgba(255, 0, 0, 0.05)' : 'transparent' }}>
                      <td className="mono" style={{ fontWeight: 700 }}>${p.strike}</td>
                      <td className="mono">{p.bid}</td>
                      <td className="mono">{p.ask}</td>
                      <td className="mono">{p.volume || 0}</td>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{p.delta?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
      <div style={{ padding: '8px 16px', fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
        Precio subyacente: <strong className="mono text-primary">${chain?.underlying_price}</strong> · Días para expiración: {chain?.days_to_expiration}
        <br/>Mostrando los primeros 20 strikes. Las griegas son calculadas vía Black-Scholes.
      </div>
    </div>
  );
}
