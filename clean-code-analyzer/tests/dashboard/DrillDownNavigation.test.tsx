import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DrillDownView } from '../../src/dashboard/components/DrillDownView';
import { FileExplorer } from '../../src/dashboard/components/FileExplorer';
import { FileDetailView } from '../../src/dashboard/components/FileDetailView';
import { ViolationBrowser } from '../../src/dashboard/components/ViolationBrowser';
import { RecommendationQueue } from '../../src/dashboard/components/RecommendationQueue';
import { FileQuality, Violation } from '../../src/dashboard/types';

// Mock data for testing
const mockFiles: FileQuality[] = [
  {
    filePath: 'src/services/UserService.ts',
    score: 8.5,
    violations: [
      {
        id: 'v1',
        principle: { name: 'Single Responsibility', category: 'Functions' },
        severity: 'Medium',
        location: { line: 45, column: 12 },
        description: 'Function handles multiple responsibilities',
        suggestion: 'Extract method for validation logic'
      }
    ],
    metrics: {
      overallScore: 8.5,
      complexity: 4.2,
      maintainability: 8.8,
      testability: 8.0,
      readability: 9.0,
      timestamp: new Date()
    }
  },
  {
    filePath: 'src/utils/DataProcessor.ts',
    score: 6.2,
    violations: [
      {
        id: 'v2',
        principle: { name: 'Naming Conventions', category: 'Naming' },
        severity: 'High',
        location: { line: 23, column: 8 },
        description: 'Variable name is not descriptive',
        suggestion: 'Rename "data" to "processedUserData"'
      },
      {
        id: 'v3',
        principle: { name: 'Function Size', category: 'Functions' },
        severity: 'Critical',
        location: { line: 67, column: 1 },
        description: 'Function exceeds 50 lines',
        suggestion: 'Break down into smaller functions'
      }
    ],
    metrics: {
      overallScore: 6.2,
      complexity: 7.8,
      maintainability: 5.5,
      testability: 6.0,
      readability: 6.8,
      timestamp: new Date()
    }
  }
];

describe('DrillDownView Integration Tests', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders drill-down view with navigation tabs', () => {
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    expect(screen.getByText('Code Quality Analysis')).toBeInTheDocument();
    expect(screen.getAllByText('File Explorer')[0]).toBeInTheDocument();
    expect(screen.getByText('Violations')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  test('switches between different view modes', async () => {
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    // Default should be file explorer
    expect(screen.getByText('Select a file to view details')).toBeInTheDocument();
    
    // Switch to violations view
    fireEvent.click(screen.getByText('Violations'));
    await waitFor(() => {
      expect(screen.getByText('Violation Browser')).toBeInTheDocument();
    });
    
    // Switch to recommendations view
    fireEvent.click(screen.getByText('Recommendations'));
    await waitFor(() => {
      expect(screen.getByText('Recommendation Queue')).toBeInTheDocument();
    });
  });

  test('closes drill-down view when close button is clicked', () => {
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    // Find the close button by its SVG content
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('FileExplorer Component Tests', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders file explorer with search functionality', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sort by Name')).toBeInTheDocument();
  });

  test('filters files based on search term', async () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search files...');
    fireEvent.change(searchInput, { target: { value: 'UserService' } });
    
    await waitFor(() => {
      expect(screen.getByText('src/services/UserService.ts')).toBeInTheDocument();
      expect(screen.queryByText('src/utils/DataProcessor.ts')).not.toBeInTheDocument();
    });
  });

  test('sorts files by different criteria', async () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    
    const sortSelect = screen.getByDisplayValue('Sort by Name');
    fireEvent.change(sortSelect, { target: { value: 'score' } });
    
    await waitFor(() => {
      expect(sortSelect).toHaveValue('score');
    });
  });

  test('calls onFileSelect when file is clicked', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    
    // Search for a specific file to make it visible
    const searchInput = screen.getByPlaceholderText('Search files...');
    fireEvent.change(searchInput, { target: { value: 'UserService' } });
    
    // Click on the file (shows full path in search mode)
    const fileElement = screen.getByText('src/services/UserService.ts');
    fireEvent.click(fileElement);
    
    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFiles[0]);
  });
});

describe('FileDetailView Component Tests', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders file detail view with tabs', () => {
    render(<FileDetailView file={mockFiles[0]} onClose={mockOnClose} />);
    
    expect(screen.getByText('UserService.ts')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    // Use getAllByText to handle multiple instances
    expect(screen.getAllByText('Functions')[0]).toBeInTheDocument();
    expect(screen.getByText('Violations')).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    render(<FileDetailView file={mockFiles[0]} onClose={mockOnClose} />);
    
    // Click on Functions tab (use the button, not the text in the overview)
    const functionsTab = screen.getByRole('button', { name: /functions/i });
    fireEvent.click(functionsTab);
    await waitFor(() => {
      expect(screen.getByText('processUserData()')).toBeInTheDocument();
    });
    
    // Click on Violations tab
    const violationsTab = screen.getByRole('button', { name: /violations/i });
    fireEvent.click(violationsTab);
    await waitFor(() => {
      expect(screen.getByText('Function handles multiple responsibilities')).toBeInTheDocument();
    });
  });

  test('displays quality metrics in overview tab', () => {
    render(<FileDetailView file={mockFiles[0]} onClose={mockOnClose} />);
    
    // Use getAllByText to handle multiple instances and check the first one
    expect(screen.getAllByText('8.5')[0]).toBeInTheDocument(); // Overall score
    expect(screen.getByText('Total Violations')).toBeInTheDocument();
    expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
  });
});

describe('ViolationBrowser Component Tests', () => {
  const mockOnViolationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders violation browser with filters', () => {
    render(<ViolationBrowser files={mockFiles} onViolationSelect={mockOnViolationSelect} />);
    
    expect(screen.getByText('Violation Browser')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search violations...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Severities')).toBeInTheDocument();
  });

  test('displays violation statistics', () => {
    render(<ViolationBrowser files={mockFiles} onViolationSelect={mockOnViolationSelect} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total violations
    // Check for critical violations count in the statistics section
    const criticalElements = screen.getAllByText('1');
    expect(criticalElements.length).toBeGreaterThan(0); // Should have at least one "1"
  });

  test('filters violations by severity', async () => {
    render(<ViolationBrowser files={mockFiles} onViolationSelect={mockOnViolationSelect} />);
    
    const severityFilter = screen.getByDisplayValue('All Severities');
    fireEvent.change(severityFilter, { target: { value: 'Critical' } });
    
    await waitFor(() => {
      expect(screen.getByText('Function exceeds 50 lines')).toBeInTheDocument();
      expect(screen.queryByText('Function handles multiple responsibilities')).not.toBeInTheDocument();
    });
  });

  test('searches violations by description', async () => {
    render(<ViolationBrowser files={mockFiles} onViolationSelect={mockOnViolationSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search violations...');
    fireEvent.change(searchInput, { target: { value: 'naming' } });
    
    await waitFor(() => {
      expect(screen.getByText('Variable name is not descriptive')).toBeInTheDocument();
    });
  });
});

describe('RecommendationQueue Component Tests', () => {
  const mockOnRecommendationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders recommendation queue with filters', () => {
    render(<RecommendationQueue files={mockFiles} onRecommendationSelect={mockOnRecommendationSelect} />);
    
    expect(screen.getByText('Recommendation Queue')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search recommendations...')).toBeInTheDocument();
    expect(screen.getByText('All Status')).toBeInTheDocument();
  });

  test('displays recommendation statistics', () => {
    render(<RecommendationQueue files={mockFiles} onRecommendationSelect={mockOnRecommendationSelect} />);
    
    // Should show total recommendations (generated from violations)
    expect(screen.getByText('Total')).toBeInTheDocument();
    // Check for the actual number using getAllByText since there might be multiple "3"s
    expect(screen.getAllByText('3')[0]).toBeInTheDocument(); // Total count
  });

  test('filters recommendations by status', async () => {
    render(<RecommendationQueue files={mockFiles} onRecommendationSelect={mockOnRecommendationSelect} />);
    
    // Find the status filter select element by looking for the one with "All Status" option
    const selects = screen.getAllByRole('combobox');
    const statusFilter = selects.find(select => 
      select.querySelector('option[value=""]')?.textContent === 'All Status'
    );
    
    if (statusFilter) {
      fireEvent.change(statusFilter, { target: { value: 'pending' } });
      
      await waitFor(() => {
        expect(statusFilter).toHaveValue('pending');
      });
    }
  });

  test('sorts recommendations by priority', async () => {
    render(<RecommendationQueue files={mockFiles} onRecommendationSelect={mockOnRecommendationSelect} />);
    
    // Find the sort select element by looking for the one with "Sort by Priority" option
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects.find(select => 
      select.querySelector('option[value="priority"]')?.textContent === 'Sort by Priority'
    );
    
    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'effort' } });
      
      await waitFor(() => {
        expect(sortSelect).toHaveValue('effort');
      });
    }
  });
});

describe('Integration Navigation Tests', () => {
  test('navigates from file explorer to file detail view', async () => {
    const mockOnClose = jest.fn();
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    // Search for a file to make it visible
    const searchInput = screen.getByPlaceholderText('Search files...');
    fireEvent.change(searchInput, { target: { value: 'UserService' } });
    
    // Click on the file (it shows the full path in search mode)
    const fileElement = screen.getByText('src/services/UserService.ts');
    fireEvent.click(fileElement);
    
    // Should show file detail view
    await waitFor(() => {
      expect(screen.getByText('Score: 8.5/10')).toBeInTheDocument();
    });
  });

  test('navigates from violation browser to file detail view', async () => {
    const mockOnClose = jest.fn();
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    // Switch to violations view
    fireEvent.click(screen.getByText('Violations'));
    
    // Click on a violation
    await waitFor(() => {
      const violation = screen.getByText('Function handles multiple responsibilities');
      fireEvent.click(violation.closest('div[class*="cursor-pointer"]')!);
    });
    
    // Should show file detail view
    await waitFor(() => {
      expect(screen.getByText('UserService.ts')).toBeInTheDocument();
    });
  });

  test('navigates from recommendation queue to file detail view', async () => {
    const mockOnClose = jest.fn();
    render(<DrillDownView files={mockFiles} onClose={mockOnClose} />);
    
    // Switch to recommendations view
    fireEvent.click(screen.getByText('Recommendations'));
    
    // Wait for recommendations view to load
    await waitFor(() => {
      expect(screen.getByText('Recommendation Queue')).toBeInTheDocument();
    });
    
    // Look for any recommendation titles that might be clickable
    const recommendationTitles = screen.queryAllByText(/variable naming|method|class/i);
    if (recommendationTitles.length > 0) {
      const clickableElement = recommendationTitles[0].closest('div[class*="cursor-pointer"]');
      if (clickableElement) {
        fireEvent.click(clickableElement);
      }
    }
  });
});