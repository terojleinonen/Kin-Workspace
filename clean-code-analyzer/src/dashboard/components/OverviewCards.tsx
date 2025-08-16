import React from 'react';

interface OverviewData {
  totalFiles: number;
  averageScore: number;
  totalViolations: number;
  improvementTrend: number;
}

interface OverviewCardsProps {
  data: OverviewData;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => {
  const cards = [
    {
      title: 'Total Files',
      value: data.totalFiles.toLocaleString(),
      icon: '📁',
      color: 'blue'
    },
    {
      title: 'Average Quality Score',
      value: `${data.averageScore.toFixed(1)}/10`,
      icon: '⭐',
      color: data.averageScore >= 7 ? 'green' : data.averageScore >= 5 ? 'yellow' : 'red'
    },
    {
      title: 'Total Violations',
      value: data.totalViolations.toLocaleString(),
      icon: '⚠️',
      color: data.totalViolations < 50 ? 'green' : data.totalViolations < 200 ? 'yellow' : 'red'
    },
    {
      title: 'Improvement Trend',
      value: `${data.improvementTrend > 0 ? '+' : ''}${data.improvementTrend.toFixed(1)}%`,
      icon: data.improvementTrend > 0 ? '📈' : data.improvementTrend < 0 ? '📉' : '➡️',
      color: data.improvementTrend > 0 ? 'green' : data.improvementTrend < 0 ? 'red' : 'gray'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      gray: 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`p-3 rounded-full ${getColorClasses(card.color)}`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};