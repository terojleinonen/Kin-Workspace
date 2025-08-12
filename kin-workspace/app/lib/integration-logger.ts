/**
 * Integration Logger
 * Centralized logging for CMS-E-commerce integration
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
  error?: Error
}

class IntegrationLogger {
  private logs: LogEntry[] = []
  private maxLogs: number = 1000

  /**
   * Log a message
   */
  log(level: LogLevel, category: string, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      error
    }

    this.logs.unshift(entry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === LogLevel.ERROR ? console.error :
                       level === LogLevel.WARN ? console.warn :
                       console.log

      logMethod(`[${level.toUpperCase()}] ${category}: ${message}`, data || '', error || '')
    }
  }

  /**
   * Debug log
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data)
  }

  /**
   * Info log
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data)
  }

  /**
   * Warning log
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data)
  }

  /**
   * Error log
   */
  error(category: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data, error)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level)
    }

    return filteredLogs.slice(0, limit)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(0, limit)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number
    byLevel: Record<LogLevel, number>
    byCategory: Record<string, number>
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0
      },
      byCategory: {} as Record<string, number>
    }

    this.logs.forEach(log => {
      stats.byLevel[log.level]++
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const integrationLogger = new IntegrationLogger()

// Convenience functions for common categories
export const apiLogger = {
  debug: (message: string, data?: any) => integrationLogger.debug('API', message, data),
  info: (message: string, data?: any) => integrationLogger.info('API', message, data),
  warn: (message: string, data?: any) => integrationLogger.warn('API', message, data),
  error: (message: string, error?: Error, data?: any) => integrationLogger.error('API', message, error, data)
}

export const syncLogger = {
  debug: (message: string, data?: any) => integrationLogger.debug('SYNC', message, data),
  info: (message: string, data?: any) => integrationLogger.info('SYNC', message, data),
  warn: (message: string, data?: any) => integrationLogger.warn('SYNC', message, data),
  error: (message: string, error?: Error, data?: any) => integrationLogger.error('SYNC', message, error, data)
}

export const dbLogger = {
  debug: (message: string, data?: any) => integrationLogger.debug('DATABASE', message, data),
  info: (message: string, data?: any) => integrationLogger.info('DATABASE', message, data),
  warn: (message: string, data?: any) => integrationLogger.warn('DATABASE', message, data),
  error: (message: string, error?: Error, data?: any) => integrationLogger.error('DATABASE', message, error, data)
}