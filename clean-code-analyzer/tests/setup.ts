/**
 * Jest test setup configuration
 */

import '@testing-library/jest-dom';
import React from 'react';

// Mock Chart.js components for testing
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => React.createElement('div', { 
    'data-testid': 'line-chart',
    'data-chart-data': JSON.stringify(props.data),
    'data-chart-options': JSON.stringify(props.options)
  }, 'Line Chart Mock'),
  Pie: (props: any) => React.createElement('div', { 
    'data-testid': 'pie-chart',
    'data-chart-data': JSON.stringify(props.data),
    'data-chart-options': JSON.stringify(props.options)
  }, 'Pie Chart Mock')
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
  ArcElement: {}
}));

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterAll(() => {
  // Cleanup after all tests
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};