'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { Candle } from '@/lib/api';

interface Props {
  candles: Candle[];
  height?: number;
  sma20?: { time: number; value: number }[];
  sma50?: { time: number; value: number }[];
  bbUpper?: { time: number; value: number }[];
  bbLower?: { time: number; value: number }[];
  bbMiddle?: { time: number; value: number }[];
}

export default function CandlestickChart({
  candles, height = 380,
  sma20, sma50, bbUpper, bbLower, bbMiddle,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !candles?.length) return;

    // Cleanup previous chart
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8a9bb0',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1f2d3d' },
        horzLines: { color: '#1f2d3d' },
      },
      crosshair: { vertLine: { labelBackgroundColor: '#1a2333' }, horzLine: { labelBackgroundColor: '#1a2333' } },
      rightPriceScale: { borderColor: '#1f2d3d' },
      timeScale: { borderColor: '#1f2d3d', timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853', downColor: '#ff3d57',
      borderUpColor: '#00c853', borderDownColor: '#ff3d57',
      wickUpColor: '#00c85388', wickDownColor: '#ff3d5788',
    });
    candleSeries.setData(candles.map(c => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));

    // Overlays
    const addLine = (data: { time: number; value: number }[] | undefined, color: string, lineWidth = 1, style = 0) => {
      if (!data?.length) return;
      const s = chart.addSeries(LineSeries, { color, lineWidth: lineWidth as any, lineStyle: style as any, priceLineVisible: false, lastValueVisible: false });
      s.setData(data.map(d => ({ time: d.time as any, value: d.value })));
    };

    addLine(sma20,    '#ffd32a', 1);   // Yellow
    addLine(sma50,    '#4e8cff', 1);   // Blue
    addLine(bbUpper,  '#00d4aa55', 1, 1); // Dashed teal
    addLine(bbLower,  '#00d4aa55', 1, 1);
    addLine(bbMiddle, '#00d4aa99', 1);

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, height);
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [candles, height, sma20, sma50, bbUpper, bbLower, bbMiddle]);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <LegendItem color="#00c853" label="Alcista" />
        <LegendItem color="#ff3d57" label="Bajista" />
        {sma20 && <LegendItem color="#ffd32a" label="SMA 20" />}
        {sma50 && <LegendItem color="#4e8cff" label="SMA 50" />}
        {bbUpper && <LegendItem color="#00d4aa" label="Bollinger" dashed />}
      </div>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 20, height: 2,
        background: dashed ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` : color,
      }} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}
