import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Logger } from '@project-manager/base/common/logging'

/**
 * Interface for log reading service
 * Must match the interface from @project-manager/application
 */
interface LogReader {
  getLogs(
    filters: LogFilters,
    limit: number,
    offset: number
  ): Promise<{ logs: RawLogEntry[]; totalCount: number }>
}

/**
 * Log filtering criteria
 * Must match the interface from @project-manager/application
 */
interface LogFilters {
  level?: 'debug' | 'info' | 'warn' | 'error'
  component?: string
  operation?: string
  traceId?: string
  startTime?: Date
  endTime?: Date
}

/**
 * Raw log entry from log storage
 * Must match the interface from @project-manager/application
 */
interface RawLogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}

/**
 * File-based log reader implementation
 * Reads log files from the filesystem and provides filtering capabilities
 */
export class FileLogReader implements LogReader {
  constructor(
    private readonly logDirectory: string,
    private readonly logger: Logger
  ) {}

  async readLogs(filters: LogFilters): Promise<RawLogEntry[]> {
    const result = await this.getLogs(filters, 1000, 0)
    return result.logs
  }

  async getLogs(
    filters: LogFilters,
    limit: number,
    offset: number
  ): Promise<{ logs: RawLogEntry[]; totalCount: number }> {
    try {
      // Get all log files in the directory
      const logFiles = await this.getLogFiles()

      // Read and parse logs from all files
      const allLogs: RawLogEntry[] = []

      for (const logFile of logFiles) {
        const filePath = join(this.logDirectory, logFile)
        const fileLogs = await this.readLogFile(filePath)
        allLogs.push(...fileLogs)
      }

      // Sort logs by timestamp (newest first)
      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Apply filters
      const filteredLogs = this.applyFilters(allLogs, filters)

      // Apply pagination
      const paginatedLogs = filteredLogs.slice(offset, offset + limit)

      return {
        logs: paginatedLogs,
        totalCount: filteredLogs.length,
      }
    } catch (error: any) {
      // Provide more helpful error message for missing directory
      if (error.code === 'ENOENT') {
        console.error(`Log directory does not exist: ${this.logDirectory}`)
        console.error(
          'Please ensure the log directory exists or run the application to create logs.'
        )
      } else {
        console.error('Error reading log files:', error)
      }
      return {
        logs: [],
        totalCount: 0,
      }
    }
  }

  private async getLogFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.logDirectory)
      const logFiles: string[] = []

      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.jsonl')) {
          const filePath = join(this.logDirectory, file)
          const stats = await stat(filePath)
          if (stats.isFile()) {
            logFiles.push(file)
          }
        }
      }

      // Sort by modification time (newest first)
      const fileStats = await Promise.all(
        logFiles.map(async file => ({
          file,
          mtime: (await stat(join(this.logDirectory, file))).mtime,
        }))
      )

      return fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).map(({ file }) => file)
    } catch (error: any) {
      // Provide more helpful error message for missing directory
      if (error.code === 'ENOENT') {
        this.logger.warn(`Log directory does not exist: ${this.logDirectory}`)
        this.logger.warn('No log files available yet. Run the application to generate logs.')
      } else {
        this.logger.warn('Unable to read log directory:', {
          error,
          logDirectory: this.logDirectory,
        })
      }
      return []
    }
  }

  private async readLogFile(filePath: string): Promise<RawLogEntry[]> {
    try {
      const content = await readFile(filePath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      const logs: RawLogEntry[] = []

      for (const line of lines) {
        try {
          // Try parsing as NDJSON first (structured logs)
          const logData = JSON.parse(line)
          const logEntry = this.parseStructuredLog(logData)
          if (logEntry) {
            logs.push(logEntry)
          }
        } catch {
          // If JSON parsing fails, try parsing as plain text log
          const logEntry = this.parsePlainTextLog(line)
          if (logEntry) {
            logs.push(logEntry)
          }
        }
      }

      return logs
    } catch (error) {
      this.logger.warn(`Unable to read log file ${filePath}:`, { error, filePath })
      return []
    }
  }

  private parseStructuredLog(data: any): RawLogEntry | null {
    try {
      // Handle Pino-style structured logs
      if (data.time && data.level && data.msg) {
        const timestamp = new Date(data.time)
        const _timeString = timestamp.toISOString()
        const level = this.mapLogLevel(data.level)
        const message = data.msg

        return {
          id:
            data.reqId || data.traceId || `${data.time}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          level,
          message,
          metadata: {
            ...data,
            time: undefined,
            level: undefined,
            msg: undefined,
          },
        }
      }

      // Handle general structured logs
      if (data.timestamp && data.level && data.message) {
        const timestamp = new Date(data.timestamp)
        const _timeString = timestamp.toISOString()
        const message = data.message

        return {
          id: data.id || `${data.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          level: data.level,
          message,
          metadata: {
            ...data,
            id: undefined,
            timestamp: undefined,
            level: undefined,
            message: undefined,
          },
        }
      }

      return null
    } catch {
      return null
    }
  }

  private parsePlainTextLog(line: string): RawLogEntry | null {
    try {
      // Try to parse common log formats
      // Format: [timestamp] [level] message
      const timestampRegex = /^\[([^\]]+)\]/
      const levelRegex = /\[(DEBUG|INFO|WARN|ERROR)\]/i

      const timestampMatch = line.match(timestampRegex)
      const levelMatch = line.match(levelRegex)

      if (timestampMatch?.[1] && levelMatch?.[1]) {
        const timestamp = new Date(timestampMatch[1])
        const _timeString = timestamp.toISOString()
        const level = levelMatch[1].toLowerCase() as 'debug' | 'info' | 'warn' | 'error'

        // Extract message (everything after the level)
        const message = line.replace(timestampRegex, '').replace(levelRegex, '').trim()

        return {
          id: `${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp,
          level,
          message,
          metadata: {
            source: 'plain-text-log',
          },
        }
      }

      // Fallback: treat as info level with current timestamp
      const timestamp = new Date()
      const _timeString = timestamp.toISOString()
      const message = line.trim()

      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        level: 'info',
        message,
        metadata: {
          source: 'plain-text-log',
        },
      }
    } catch {
      return null
    }
  }

  private mapLogLevel(pinoLevel: number | string): 'debug' | 'info' | 'warn' | 'error' {
    if (typeof pinoLevel === 'string') {
      const level = pinoLevel.toLowerCase()
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        return level as 'debug' | 'info' | 'warn' | 'error'
      }
    }

    // Pino numeric levels: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal
    if (typeof pinoLevel === 'number') {
      if (pinoLevel <= 20) return 'debug'
      if (pinoLevel <= 30) return 'info'
      if (pinoLevel <= 40) return 'warn'
      return 'error'
    }

    return 'info'
  }

  private applyFilters(logs: RawLogEntry[], filters: LogFilters): RawLogEntry[] {
    return logs.filter(log => {
      // Level filter - filters.level is a single string
      if (filters.level && log.level !== filters.level) {
        return false
      }

      // Component filter - filters.component is a single string
      if (filters.component && log.metadata?.component !== filters.component) {
        return false
      }

      // Operation filter
      if (filters.operation && log.metadata?.operation !== filters.operation) {
        return false
      }

      // Trace ID filter
      if (filters.traceId && log.metadata?.traceId !== filters.traceId) {
        return false
      }

      // Time range filters
      if (filters.startTime && log.timestamp < filters.startTime) {
        return false
      }

      if (filters.endTime && log.timestamp > filters.endTime) {
        return false
      }

      return true
    })
  }
}
