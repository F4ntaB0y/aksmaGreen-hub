import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useTheme } from '../../context/ThemeContext';

export default function ClassScoreBarChart({ data = [] }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isDark } = useTheme();

  const hasData = data.some(item => item.score > 0);

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
    const labels = data.map(d => `Kelas ${d.name}`);
    const scores = data.map(d => d.score);
    const counts = data.map(d => d.count);

    // Background gradient for bars
    const backgroundColors = scores.map(s => {
      if (s >= 90) return isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.85)';
      if (s >= 80) return isDark ? 'rgba(20, 184, 166, 0.85)' : 'rgba(13, 148, 136, 0.85)';
      if (s > 0) return isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)';
      return isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(203, 213, 225, 0.5)';
    });

    const borderColors = scores.map(s => {
      if (s >= 90) return '#10b981';
      if (s >= 80) return '#14b8a6';
      if (s > 0) return '#f59e0b';
      return '#94a3b8';
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Skor 5R Rata-rata (%)',
            data: scores,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
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
                const count = counts[idx] || 0;
                return [
                  ` Skor: ${context.parsed.y}%`,
                  ` Jumlah Laporan: ${count} kali`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: {
                size: 11,
                weight: '600'
              }
            }
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
            },
            ticks: {
              stepSize: 20,
              color: isDark ? '#94a3b8' : '#64748b',
              callback: (val) => `${val}%`,
              font: {
                size: 11
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
  }, [data, isDark, hasData]);

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50/50 dark:bg-obsidian-900/40 border border-dashed border-emerald-500/20">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 font-bold text-base">
          5R
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Belum Ada Data Rekap Piket Kelas
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Grafik bar Chart.js akan otomatis muncul saat siswa mulai menginput laporan piket harian pada fitur AKSMA Clean Check.
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
