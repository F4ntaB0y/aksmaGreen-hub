import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useTheme } from '../../context/ThemeContext';

const PALETTE = [
  { fill: 'rgba(16, 185, 129, 0.85)', stroke: '#10b981' }, // Emerald
  { fill: 'rgba(14, 165, 233, 0.85)', stroke: '#0ea5e9' }, // Sky
  { fill: 'rgba(245, 158, 11, 0.85)', stroke: '#f59e0b' }, // Amber
  { fill: 'rgba(244, 63, 94, 0.85)', stroke: '#f43f5e' },  // Rose
  { fill: 'rgba(168, 85, 247, 0.85)', stroke: '#a855f7' }, // Purple
  { fill: 'rgba(20, 184, 166, 0.85)', stroke: '#14b8a6' }  // Teal
];

export default function WasteCompositionDoughnutChart({ data = [], total = 0 }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isDark } = useTheme();

  const validItems = data.filter(item => item.total > 0);
  const hasData = validItems.length > 0 && total > 0;

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;

    if (canvasRef.current) {
      const existing = Chart.getChart(canvasRef.current);
      if (existing) {
        existing.destroy();
      }
    }
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    const labels = validItems.map(d => d.name);
    const totals = validItems.map(d => d.total);
    const units = validItems.map(d => d.unit);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: totals,
            backgroundColor: validItems.map((_, i) => PALETTE[i % PALETTE.length].fill),
            borderColor: validItems.map((_, i) => PALETTE[i % PALETTE.length].stroke),
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 4,
              color: isDark ? '#cbd5e1' : '#475569',
              font: {
                size: 11,
                weight: '600'
              },
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(8, 20, 14, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#ffffff' : '#0f172a',
            bodyColor: isDark ? '#a7f3d0' : '#047857',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const val = context.parsed;
                const unit = units[idx] || 'pcs';
                const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${val} ${unit} (${percent}% dari total)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      if (canvasRef.current) {
        const existing = Chart.getChart(canvasRef.current);
        if (existing) {
          existing.destroy();
        }
      }
    };
  }, [data, total, isDark, hasData]);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50/50 dark:bg-obsidian-900/40 border border-dashed border-emerald-500/20">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 font-bold text-base">
          ECO
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Belum Ada Data Sampah Terpilah
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Grafik donat Chart.js akan memvisualisasikan proporsi sampah plastik, kertas, dan kardus setelah setoran terverifikasi petugas.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 pt-2">
      <canvas ref={canvasRef} />
    </div>
  );
}
