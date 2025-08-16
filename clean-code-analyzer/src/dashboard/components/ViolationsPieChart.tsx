import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ViolationsPieChartProps {
  data: Record<string, number>;
}

export const ViolationsPieChart: React.FC<ViolationsPieChartProps> = ({ data }) => {
  const principles = Object.keys(data);
  const counts = Object.values(data);

  const colors = [
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(245, 158, 11, 0.8)',  // Amber
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(168, 85, 247, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)'   // Pink
  ];

  const borderColors = [
    'rgba(239, 68, 68, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(168, 85, 247, 1)',
    'rgba(236, 72, 153, 1)'
  ];

  const chartData = {
    labels: principles,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.slice(0, principles.length),
        borderColor: borderColors.slice(0, principles.length),
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Violations by Clean Code Principle',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const totalViolations = counts.reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Total Violations: <span className="font-semibold text-gray-900">{totalViolations}</span>
        </p>
      </div>
    </div>
  );
};