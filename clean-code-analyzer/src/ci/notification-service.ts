import { NotificationConfig, QualityComparison, TrendData } from './types';
import * as https from 'https';

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * Send quality regression notification
   */
  async notifyRegression(comparison: QualityComparison): Promise<void> {
    const shouldNotify = comparison.scoreDelta < -5 || comparison.regressions.length > 0;
    
    if (!shouldNotify) {
      return;
    }

    const promises: Promise<void>[] = [];

    if (this.config.slack) {
      promises.push(this.sendSlackNotification(comparison));
    }

    if (this.config.email && (!this.config.email.onlyOnRegression || comparison.regressions.length > 0)) {
      promises.push(this.sendEmailNotification(comparison));
    }

    if (this.config.teams) {
      promises.push(this.sendTeamsNotification(comparison));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send quality improvement celebration
   */
  async notifyImprovement(comparison: QualityComparison): Promise<void> {
    if (comparison.scoreDelta <= 5) {
      return; // Only celebrate significant improvements
    }

    if (this.config.slack && !this.config.slack.onlyOnFailure) {
      await this.sendSlackImprovement(comparison);
    }
  }

  /**
   * Send weekly quality trend report
   */
  async sendTrendReport(trends: TrendData[]): Promise<void> {
    if (this.config.email) {
      await this.sendTrendEmail(trends);
    }
  }

  /**
   * Send Slack notification for quality issues
   */
  private async sendSlackNotification(comparison: QualityComparison): Promise<void> {
    if (!this.config.slack?.webhookUrl) {
      return;
    }

    const message = {
      channel: this.config.slack.channel,
      username: 'Code Quality Bot',
      icon_emoji: ':warning:',
      attachments: [
        {
          color: 'danger',
          title: '🚨 Code Quality Alert',
          fields: [
            {
              title: 'Quality Score',
              value: `${comparison.currentScore} (${comparison.scoreDelta > 0 ? '+' : ''}${comparison.scoreDelta})`,
              short: true
            },
            {
              title: 'Regressions',
              value: comparison.regressions.length.toString(),
              short: true
            }
          ],
          text: comparison.regressions.slice(0, 3).join('\n'),
          footer: 'Clean Code Analyzer',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    await this.sendWebhook(this.config.slack.webhookUrl, message);
  }

  /**
   * Send Slack notification for quality improvements
   */
  private async sendSlackImprovement(comparison: QualityComparison): Promise<void> {
    if (!this.config.slack?.webhookUrl) {
      return;
    }

    const message = {
      channel: this.config.slack.channel,
      username: 'Code Quality Bot',
      icon_emoji: ':tada:',
      attachments: [
        {
          color: 'good',
          title: '🎉 Code Quality Improvement!',
          fields: [
            {
              title: 'Quality Score',
              value: `${comparison.currentScore} (+${comparison.scoreDelta})`,
              short: true
            },
            {
              title: 'Improvements',
              value: comparison.improvements.length.toString(),
              short: true
            }
          ],
          text: comparison.improvements.slice(0, 3).join('\n'),
          footer: 'Clean Code Analyzer',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    await this.sendWebhook(this.config.slack.webhookUrl, message);
  }

  /**
   * Send email notification for quality issues
   */
  private async sendEmailNotification(comparison: QualityComparison): Promise<void> {
    if (!this.config.email?.smtpConfig) {
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
      host: this.config.email.smtpConfig.host,
      port: this.config.email.smtpConfig.port,
      secure: this.config.email.smtpConfig.port === 465,
      auth: {
        user: this.config.email.smtpConfig.username,
        pass: this.config.email.smtpConfig.password
      }
    });

    const html = this.generateEmailHTML(comparison);

    const mailOptions = {
      from: 'Code Quality Bot <noreply@example.com>',
      to: this.config.email.recipients.join(', '),
      subject: `Code Quality Alert - Score: ${comparison.currentScore}`,
      html: html
    };

    await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send Microsoft Teams notification
   */
  private async sendTeamsNotification(comparison: QualityComparison): Promise<void> {
    if (!this.config.teams?.webhookUrl) {
      return;
    }

    const message = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Code Quality Alert',
      themeColor: comparison.scoreDelta < 0 ? 'FF0000' : '00FF00',
      sections: [
        {
          activityTitle: '🚨 Code Quality Alert',
          activitySubtitle: `Quality score: ${comparison.currentScore} (${comparison.scoreDelta > 0 ? '+' : ''}${comparison.scoreDelta})`,
          facts: [
            {
              name: 'Regressions',
              value: comparison.regressions.length.toString()
            },
            {
              name: 'Improvements',
              value: comparison.improvements.length.toString()
            }
          ],
          text: comparison.regressions.slice(0, 3).join('\n\n')
        }
      ]
    };

    await this.sendWebhook(this.config.teams.webhookUrl, message);
  }

  /**
   * Send weekly trend report via email
   */
  private async sendTrendEmail(trends: TrendData[]): Promise<void> {
    if (!this.config.email?.smtpConfig || trends.length === 0) {
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
      host: this.config.email.smtpConfig.host,
      port: this.config.email.smtpConfig.port,
      secure: this.config.email.smtpConfig.port === 465,
      auth: {
        user: this.config.email.smtpConfig.username,
        pass: this.config.email.smtpConfig.password
      }
    });

    const html = this.generateTrendEmailHTML(trends);

    const mailOptions = {
      from: 'Code Quality Bot <noreply@example.com>',
      to: this.config.email.recipients.join(', '),
      subject: 'Weekly Code Quality Report',
      html: html
    };

    await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send trend email:', error);
    }
  }

  /**
   * Send webhook request
   */
  private async sendWebhook(url: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Generate HTML email for quality comparison
   */
  private generateEmailHTML(comparison: QualityComparison): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
          .score { font-size: 24px; font-weight: bold; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
          .section { margin: 20px 0; }
          .list-item { margin: 5px 0; padding: 5px; background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🔍 Code Quality Report</h2>
          <div class="score ${comparison.scoreDelta >= 0 ? 'positive' : 'negative'}">
            Score: ${comparison.currentScore} (${comparison.scoreDelta > 0 ? '+' : ''}${comparison.scoreDelta})
          </div>
        </div>
        
        ${comparison.regressions.length > 0 ? `
        <div class="section">
          <h3>❌ Quality Regressions (${comparison.regressions.length})</h3>
          ${comparison.regressions.map(r => `<div class="list-item">${r}</div>`).join('')}
        </div>
        ` : ''}
        
        ${comparison.improvements.length > 0 ? `
        <div class="section">
          <h3>✅ Quality Improvements (${comparison.improvements.length})</h3>
          ${comparison.improvements.map(i => `<div class="list-item">${i}</div>`).join('')}
        </div>
        ` : ''}
        
        <div class="section">
          <h3>📋 Top Recommendations</h3>
          ${comparison.recommendations.slice(0, 5).map(r => 
            `<div class="list-item"><strong>${r.severity.toUpperCase()}:</strong> ${r.description}</div>`
          ).join('')}
        </div>
        
        <p><a href="${comparison.reportUrl}">View Full Report</a></p>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML email for trend report
   */
  private generateTrendEmailHTML(trends: TrendData[]): string {
    const latest = trends[trends.length - 1];
    const oldest = trends[0];
    const scoreDelta = latest.score - oldest.score;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
          .trend { font-size: 18px; margin: 10px 0; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📈 Weekly Code Quality Trend Report</h2>
          <div class="trend ${scoreDelta >= 0 ? 'positive' : 'negative'}">
            Overall Trend: ${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(1)} points
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Violations</th>
              <th>Author</th>
            </tr>
          </thead>
          <tbody>
            ${trends.slice(-10).map(trend => `
              <tr>
                <td>${new Date(trend.timestamp).toLocaleDateString()}</td>
                <td>${trend.score}</td>
                <td>${trend.violations}</td>
                <td>${trend.author}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}