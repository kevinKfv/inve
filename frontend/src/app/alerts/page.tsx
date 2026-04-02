'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { api, Alert } from '@/lib/api';
import { Bell, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

const CONDITIONS = [
  { value: 'rsi_below', label: 'RSI por debajo de', unit: '' },
  { value: 'rsi_above', label: 'RSI por encima de', unit: '' },
  { value: 'price_below', label: 'Precio por debajo de $', unit: '$' },
  { value: 'price_above', label: 'Precio por encima de $', unit: '$' },
  { value: 'macd_cross_up', label: 'MACD cruce alcista', unit: '' },
  { value: 'macd_cross_down', label: 'MACD cruce bajista', unit: '' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ticker, setTicker] = useState('AAPL');
  const [condition, setCondition] = useState('rsi_below');
  const [threshold, setThreshold] = useState(30);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Messenger integration state
  const [sendTelegram, setSendTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappApi, setWhatsappApi] = useState('');

  // Cargar estado inicial desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alertsFormState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ticker) setTicker(parsed.ticker);
        if (parsed.condition) setCondition(parsed.condition);
        if (parsed.threshold !== undefined) setThreshold(parsed.threshold);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.sendTelegram !== undefined) setSendTelegram(parsed.sendTelegram);
        if (parsed.telegramUser) setTelegramUser(parsed.telegramUser);
        if (parsed.sendWhatsapp !== undefined) setSendWhatsapp(parsed.sendWhatsapp);
        if (parsed.whatsappPhone) setWhatsappPhone(parsed.whatsappPhone);
        if (parsed.whatsappApi) setWhatsappApi(parsed.whatsappApi);
      }
    } catch (e) {}
  }, []);

  // Guardar estado en localStorage cuando cambia
  useEffect(() => {
    const state = {
      ticker, condition, threshold, description,
      sendTelegram, telegramUser,
      sendWhatsapp, whatsappPhone, whatsappApi
    };
    localStorage.setItem('alertsFormState', JSON.stringify(state));
  }, [ticker, condition, threshold, description, sendTelegram, telegramUser, sendWhatsapp, whatsappPhone, whatsappApi]);

  const fetchAlerts = async () => {
    const data = await api.getAlerts();
    setAlerts(data.alerts);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const create = async () => {
    setLoading(true);
    try {
      await api.createAlert({ 
        ticker, condition, threshold, description,
        telegram_user: sendTelegram ? telegramUser : '',
        whatsapp_phone: sendWhatsapp ? whatsappPhone : '',
        whatsapp_apikey: sendWhatsapp ? whatsappApi : ''
      });
      await fetchAlerts();
      setDescription('');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    await api.deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const condLabel = CONDITIONS.find(c => c.value === condition);
  const needsThreshold = !condition.includes('cross');

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Sistema de <span className="gradient-text">Alertas</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Las alertas se evalúan al acceder a la página de análisis del activo.
        </p>

        {/* Create form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">Nueva Alerta</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ticker</label>
              <input className="input" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Condición</label>
              <select className="input" value={condition} onChange={e => setCondition(e.target.value)}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {needsThreshold && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Umbral</label>
                <input className="input" type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Descripción (opcional)</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mi alerta..." />
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 16, fontSize: 13 }}>Notificaciones (vía CallMeBot)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Telegram Config */}
            <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={sendTelegram} onChange={e => setSendTelegram(e.target.checked)} style={{ width: 14, height: 14 }} />
                📱 Enviar por Telegram
              </label>
              {sendTelegram && (
                <div className="animate-fade-in" style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ID de Chat Telegram</label>
                  <input className="input" value={telegramUser} onChange={e => setTelegramUser(e.target.value)} placeholder="Ej: 123456789" style={{ marginBottom: 6 }} />
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Búscalo enviándole cualquier mensaje a <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>@userinfobot</a>.
                  </p>
                </div>
              )}
            </div>

            {/* WhatsApp Config */}
            <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--bg-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={sendWhatsapp} onChange={e => setSendWhatsapp(e.target.checked)} style={{ width: 14, height: 14 }} />
                💬 Enviar por WhatsApp
              </label>
              {sendWhatsapp && (
                <div className="animate-fade-in" style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Teléfono (con + y código de país)</label>
                    <input className="input" value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="+34123456789" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CallMeBot API Key</label>
                    <input className="input" value={whatsappApi} onChange={e => setWhatsappApi(e.target.value)} placeholder="012345" />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Envía <span style={{ fontFamily: 'monospace' }}>I allow callmebot to send me messages</span> al <a href="https://api.callmebot.com/whatsapp.php" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>bot de WhatsApp</a>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            📋 {ticker} — {condLabel?.label} {needsThreshold ? threshold : ''}
          </div>

          <button className="btn btn-primary" onClick={create} disabled={loading}>
            <Plus size={14} />
            Crear Alerta
          </button>
        </div>

        {/* Alert list */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Alertas Activas</span>
            <span className="badge badge-accent">{alerts.length}</span>
          </div>

          {alerts.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No hay alertas configuradas aún.</p>
            </div>
          )}

          {alerts.map(alert => (
            <div key={alert.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--bg-border)',
              background: alert.triggered ? 'var(--green-dim)' : 'transparent',
              transition: 'background 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {alert.triggered
                  ? <CheckCircle size={16} color="var(--green)" />
                  : <Clock size={16} color="var(--text-muted)" />}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{alert.ticker}</span>
                    <span className={`badge ${alert.triggered ? 'badge-green' : 'badge-muted'}`}>
                      {alert.triggered ? 'DISPARADA' : 'PENDIENTE'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{alert.description}</p>
                  {alert.triggered_at && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Disparada: {new Date(alert.triggered_at).toLocaleString('es')}
                    </p>
                  )}
                </div>
              </div>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => remove(alert.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
