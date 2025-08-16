import { NotificationService } from '../../src/ci/notification-service';
import { NotificationConfig, QualityComparison, TrendData } from '../../src/ci/types';
import * as https from 'https';
// Mock nodemailer at module level
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn()
}));

// Mock dependencies
jest.mock('https');
jest.mock('nodemailer');

const mockHttps = https as jest.Mocked<typeof https>;

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockConfig: NotificationConfig;
  let mockComparison: QualityComparison;

  beforeEach(() => {
    mockConfig = {
      slack: {
        webhookUrl: 'https://hooks.slack.com/test',
        channel: '#code-quality',
        onlyOnFailure: true
      },
      email: {
        recipients: ['dev@example.com'],
        smtpConfig: {
          host: 'smtp.gmail.com',
          port: 587,
          username: 'test@example.com',
          password: 'password'
        },
        onlyOnRegression: true
      },
      teams: {
        webhookUrl: 'https://outlook.office.com/webhook/test',
        onlyOnFailure: true
      }
    };

    mockComparison = {
      baselineScore: 75,
      currentScore: 65,
      scoreDelta: -10,
      improvements: [],
      regressions: [
        'Regression in src/test.ts: 80 → 60',
        'Regression in src/utils.ts: 70 → 50'
      ],
      recommendations: [
        {
          description: 'Function too long in src/test.ts',
          severity: 'high',
          effort: 'medium'
        }
      ],
      reportUrl: 'reports/quality-report.html'
    };

    notificationService = new NotificationService(mockConfig);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('notifyRegression', () => {
    it('should send notifications when quality regresses significantly', async () => {
      // Mock HTTPS request for webhook
      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };
      
      const mockResponse = {
        statusCode: 200
      };

      mockHttps.request.mockImplementation((options: any, callback?: any) => {
        if (callback) {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      // Mock nodemailer
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      };
      const nodemailer = require('nodemailer');
      nodemailer.createTransporter.mockReturnValue(mockTransporter);

      await notificationService.notifyRegression(mockComparison);

      // Should send Slack notification
      expect(mockHttps.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'hooks.slack.com'
        }),
        expect.any(Function)
      );

      // Should send email notification (due to regressions)
      expect(mockNodemailer.createTransporter).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Code Quality Alert - Score: 65',
          to: 'dev@example.com'
        })
      );

      // Should send Teams notification
      expect(mockHttps.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'outlook.office.com'
        }),
        expect.any(Function)
      );
    });

    it('should not send notifications for minor quality changes', async () => {
      const minorRegression: QualityComparison = {
        ...mockComparison,
        scoreDelta: -2,
        regressions: []
      };

      await notificationService.notifyRegression(minorRegression);

      expect(mockHttps.request).not.toHaveBeenCalled();
      expect(mockNodemailer.createTransporter).not.toHaveBeenCalled();
    });

    it('should handle webhook failures gracefully', async () => {
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Network error'));
          }
        }),
        write: jest.fn(),
        end: jest.fn()
      };

      mockHttps.request.mockReturnValue(mockRequest as any);

      // Should not throw despite webhook failure
      await expect(notificationService.notifyRegression(mockComparison)).resolves.not.toThrow();
    });

    it('should respect onlyOnRegression email setting', async () => {
      const noRegressionComparison: QualityComparison = {
        ...mockComparison,
        regressions: [],
        scoreDelta: -8 // Still significant drop but no specific regressions
      };

      await notificationService.notifyRegression(noRegressionComparison);

      // Should not send email when onlyOnRegression is true and no regressions
      expect(mockNodemailer.createTransporter).not.toHaveBeenCalled();
    });
  });

  describe('notifyImprovement', () => {
    it('should send improvement notifications for significant gains', async () => {
      const improvement: QualityComparison = {
        ...mockComparison,
        currentScore: 85,
        scoreDelta: 10,
        improvements: ['Improved src/test.ts: 75 → 85'],
        regressions: []
      };

      // Update config to allow improvement notifications
      const improvementConfig = {
        ...mockConfig,
        slack: {
          ...mockConfig.slack!,
          onlyOnFailure: false
        }
      };

      const improvementService = new NotificationService(improvementConfig);

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };
      
      const mockResponse = {
        statusCode: 200
      };

      mockHttps.request.mockImplementation((options: any, callback?: any) => {
        if (callback) {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      await improvementService.notifyImprovement(improvement);

      expect(mockHttps.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'hooks.slack.com'
        }),
        expect.any(Function)
      );

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('Code Quality Improvement')
      );
    });

    it('should not send notifications for minor improvements', async () => {
      const minorImprovement: QualityComparison = {
        ...mockComparison,
        scoreDelta: 3
      };

      await notificationService.notifyImprovement(minorImprovement);

      expect(mockHttps.request).not.toHaveBeenCalled();
    });

    it('should respect onlyOnFailure setting for improvements', async () => {
      const improvement: QualityComparison = {
        ...mockComparison,
        scoreDelta: 10
      };

      // Config has onlyOnFailure: true, so no improvement notifications
      await notificationService.notifyImprovement(improvement);

      expect(mockHttps.request).not.toHaveBeenCalled();
    });
  });

  describe('sendTrendReport', () => {
    it('should send weekly trend report via email', async () => {
      const trends: TrendData[] = [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          commit: 'abc123',
          branch: 'main',
          score: 75,
          violations: 10,
          author: 'developer1'
        },
        {
          timestamp: '2023-01-02T00:00:00.000Z',
          commit: 'def456',
          branch: 'main',
          score: 80,
          violations: 8,
          author: 'developer2'
        }
      ];

      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      };
      mockNodemailer.createTransporter.mockReturnValue(mockTransporter as any);

      await notificationService.sendTrendReport(trends);

      expect(mockNodemailer.createTransporter).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Weekly Code Quality Report',
          html: expect.stringContaining('Weekly Code Quality Trend Report')
        })
      );
    });

    it('should not send trend report when no trends available', async () => {
      await notificationService.sendTrendReport([]);

      expect(mockNodemailer.createTransporter).not.toHaveBeenCalled();
    });
  });

  describe('webhook sending', () => {
    it('should handle successful webhook responses', async () => {
      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };
      
      const mockResponse = {
        statusCode: 200
      };

      mockHttps.request.mockImplementation((options: any, callback?: any) => {
        if (callback) {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      await notificationService.notifyRegression(mockComparison);

      expect(mockRequest.write).toHaveBeenCalled();
      expect(mockRequest.end).toHaveBeenCalled();
    });

    it('should handle webhook HTTP errors', async () => {
      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };
      
      const mockResponse = {
        statusCode: 500
      };

      mockHttps.request.mockImplementation((options: any, callback?: any) => {
        if (callback) {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      // Should handle error gracefully (Promise.allSettled)
      await expect(notificationService.notifyRegression(mockComparison)).resolves.not.toThrow();
    });
  });

  describe('email generation', () => {
    it('should generate proper HTML email for quality comparison', async () => {
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      };
      mockNodemailer.createTransporter.mockReturnValue(mockTransporter as any);

      await notificationService.notifyRegression(mockComparison);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('Code Quality Report');
      expect(emailCall.html).toContain('Score: 65');
      expect(emailCall.html).toContain('Quality Regressions');
      expect(emailCall.html).toContain('src/test.ts: 80 → 60');
    });

    it('should generate proper HTML email for trend report', async () => {
      const trends: TrendData[] = [
        {
          timestamp: '2023-01-01T00:00:00.000Z',
          commit: 'abc123',
          branch: 'main',
          score: 75,
          violations: 10,
          author: 'developer1'
        }
      ];

      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      };
      mockNodemailer.createTransporter.mockReturnValue(mockTransporter as any);

      await notificationService.sendTrendReport(trends);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('Weekly Code Quality Trend Report');
      expect(emailCall.html).toContain('developer1');
      expect(emailCall.html).toContain('75');
    });
  });
});