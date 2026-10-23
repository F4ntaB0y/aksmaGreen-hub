import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useTheme } from '../../context/ThemeContext';

export default function ReportStatusChart({ solved = 0, inProgress = 0, fresh = 0 }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isDark } = useTheme();

  const total = solved + inProgress + fresh;
  const hasData = total > 0;

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

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Selesai Ditangani', 'Sedang Diproses', 'Aduan Baru'],
        datasets: [
          {
            data: [solved, inProgress, fresh],
            backgroundColor: [
              'rgba(16, 185, 129, 0.85)', // Emerald
              'rgba(245, 158, 11, 0.85)', // Amber
              'rgba(239, 68, 68, 0.85)'   // Rose
            ],
            borderColor: [
              '#10b981',
              '#f59e0b',
              '#ef4444'
            ],
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
                const val = context.parsed;
                const percent = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${val} Aduan (${percent}% dari total)`;
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
  }, [solved, inProgress, fresh, total, isDark, hasData]);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50/50 dark:bg-obsidian-900/40 border border-dashed border-emerald-500/20">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 font-bold text-base">
          GPS
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Belum Ada Data Aduan Sarpras
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Grafik donat Chart.js akan menampilkan rasio penyelesaian tiket masalah kebersihan & fasilitas saat ada laporan masuk.
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
