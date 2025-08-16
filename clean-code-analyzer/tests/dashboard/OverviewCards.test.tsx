import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OverviewCards } from '../../src/dashboard/components/OverviewCards';

describe('OverviewCards Component', () => {
  const mockData = {
    totalFiles: 150,
    averageScore: 7.8,
    totalViolations: 32,
    improvementTrend: 12.5
  };

  it('renders all overview cards with correct data', () => {
    render(<OverviewCards data={mockData} />);
    
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    
    expect(screen.getByText('Average Quality Score')).toBeInTheDocument();
    expect(screen.getByText('7.8/10')).toBeInTheDocument();
    
    expect(screen.getByText('Total Violations')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    
    expect(screen.getByText('Improvement Trend')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('displays correct colors for high quality score', () => {
    const highScoreData = { ...mockData, averageScore: 8.5 };
    render(<OverviewCards data={highScoreData} />);
    
    const scoreCard = screen.getByText('8.5/10').closest('div')?.parentElement;
    expect(scoreCard?.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('displays correct colors for medium quality score', () => {
    const mediumScoreData = { ...mockData, averageScore: 6.0 };
    render(<OverviewCards data={mediumScoreData} />);
    
    const scoreCard = screen.getByText('6.0/10').closest('div')?.parentElement;
    expect(scoreCard?.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('displays correct colors for low quality score', () => {
    const lowScoreData = { ...mockData, averageScore: 3.5 };
    render(<OverviewCards data={lowScoreData} />);
    
    const scoreCard = screen.getByText('3.5/10').closest('div')?.parentElement;
    expect(scoreCard?.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('displays correct colors for low violations count', () => {
    const lowViolationsData = { ...mockData, totalViolations: 25 };
    render(<OverviewCards data={lowViolationsData} />);
    
    const violationsCard = screen.getByText('25').closest('div')?.parentElement;
    expect(violationsCard?.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('displays correct colors for high violations count', () => {
    const highViolationsData = { ...mockData, totalViolations: 250 };
    render(<OverviewCards data={highViolationsData} />);
    
    const violationsCard = screen.getByText('250').closest('div')?.parentElement;
    expect(violationsCard?.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('displays positive trend with up arrow', () => {
    const positiveTrendData = { ...mockData, improvementTrend: 15.3 };
    render(<OverviewCards data={positiveTrendData} />);
    
    expect(screen.getByText('+15.3%')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('displays negative trend with down arrow', () => {
    const negativeTrendData = { ...mockData, improvementTrend: -8.2 };
    render(<OverviewCards data={negativeTrendData} />);
    
    expect(screen.getByText('-8.2%')).toBeInTheDocument();
    expect(screen.getByText('📉')).toBeInTheDocument();
  });

  it('displays neutral trend with right arrow', () => {
    const neutralTrendData = { ...mockData, improvementTrend: 0 };
    render(<OverviewCards data={neutralTrendData} />);
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('➡️')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    const largeNumberData = { ...mockData, totalFiles: 1234567 };
    render(<OverviewCards data={largeNumberData} />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('applies hover effects to cards', () => {
    render(<OverviewCards data={mockData} />);
    
    const cards = screen.getAllByRole('generic').filter(el => 
      el.className.includes('hover:shadow-md')
    );
    
    expect(cards.length).toBeGreaterThan(0);
  });

  it('displays appropriate icons for each metric', () => {
    render(<OverviewCards data={mockData} />);
    
    expect(screen.getByText('📁')).toBeInTheDocument(); // Files icon
    expect(screen.getByText('⭐')).toBeInTheDocument(); // Score icon
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // Violations icon
    expect(screen.getByText('📈')).toBeInTheDocument(); // Trend icon
  });
});