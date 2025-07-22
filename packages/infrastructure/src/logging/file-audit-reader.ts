import type { Logger } from '@project-manager/base/common/logging'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

// Define types locally as they are not in base layer
interface AuditFilters {
  operation?: string[]
  entityType?: string[]
  actor?: string[]
  dateRange?: { start: Date; end: Date }
  limit?: number
  offset?: number
  operationId?: string
  resourceType?: string
  entityId?: string
  actorType?: string
  actorId?: string
  source?: string
  traceId?: string
  success?: boolean
  startTime?: Date
  endTime?: Date
}

interface RawAuditLogEntry {
  timestamp: string
  operation: string
  entityType: string
  entityId: string
  actor: { id: string; type: string }
  changes?: any[]
  [key: string]: any
}

interface AuditReader {
  readAuditLogs(filters: AuditFilters): Promise<RawAuditLogEntry[]>
  getAuditLogs(
    filters: AuditFilters,
    limit: number,
    offset: number
  ): Promise<{ auditLogs: RawAuditLogEntry[]; totalCount: number }>
}

/**
 * File-based audit log reader implementation
 * Reads audit log files from the filesystem and provides filtering capabilities
 */
export class FileAuditReader implements AuditReader {
  constructor(
    private readonly auditDirectory: string,
    private readonly logger: Logger
  ) {}

  async readAuditLogs(filters: AuditFilters): Promise<RawAuditLogEntry[]> {
    const result = await this.getAuditLogs(filters, filters.limit || 1000, filters.offset || 0)
    return result.auditLogs
  }

  async getAuditLogs(
    filters: AuditFilters,
    limit: number,
    offset: number
  ): Promise<{ auditLogs: RawAuditLogEntry[]; totalCount: number }> {
    try {
      // Get all audit log files in the directory
      const auditFiles = await this.getAuditFiles()

      // Read and parse audit logs from all files
      const allAuditLogs: RawAuditLogEntry[] = []

      for (const auditFile of auditFiles) {
        const filePath = join(this.auditDirectory, auditFile)
        const fileAuditLogs = await this.readAuditFile(filePath)
        allAuditLogs.push(...fileAuditLogs)
      }

      // Sort audit logs by timestamp (newest first)
      allAuditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Apply filters
      const filteredAuditLogs = this.applyFilters(allAuditLogs, filters)

      // Apply pagination
      const paginatedAuditLogs = filteredAuditLogs.slice(offset, offset + limit)

      return {
        auditLogs: paginatedAuditLogs,
        totalCount: filteredAuditLogs.length,
      }
    } catch (error: any) {
      // Provide more helpful error message for missing directory
      if (error.code === 'ENOENT') {
        console.error(`Audit log directory does not exist: ${this.auditDirectory}`)
        console.error(
          'Please ensure the audit log directory exists or run the application to create audit logs.'
        )
      } else {
        console.error('Error reading audit log files:', error)
      }
      return {
        auditLogs: [],
        totalCount: 0,
      }
    }
  }

  private async getAuditFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.auditDirectory)
      const auditFiles: string[] = []

      for (const file of files) {
        if (file.includes('audit') && (file.endsWith('.log') || file.endsWith('.jsonl'))) {
          const filePath = join(this.auditDirectory, file)
          const stats = await stat(filePath)
          if (stats.isFile()) {
            auditFiles.push(file)
          }
        }
      }

      // Sort by modification time (newest first)
      const fileStats = await Promise.all(
        auditFiles.map(async file => ({
          file,
          mtime: (await stat(join(this.auditDirectory, file))).mtime,
        }))
      )

      return fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).map(({ file }) => file)
    } catch (error: any) {
      // Provide more helpful error message for missing directory
      if (error.code === 'ENOENT') {
        this.logger.warn(`Audit log directory does not exist: ${this.auditDirectory}`)
        this.logger.warn(
          'No audit log files available yet. Run the application to generate audit logs.'
        )
      } else {
        this.logger.warn('Unable to read audit log directory:', {
          error,
          auditDirectory: this.auditDirectory,
        })
      }
      return []
    }
  }

  private async readAuditFile(filePath: string): Promise<RawAuditLogEntry[]> {
    try {
      const content = await readFile(filePath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      const auditLogs: RawAuditLogEntry[] = []

      for (const line of lines) {
        try {
          const auditData = JSON.parse(line)
          const auditEntry = this.parseAuditLogEntry(auditData)
          if (auditEntry) {
            auditLogs.push(auditEntry)
          }
        } catch (error) {
          this.logger.warn(`Failed to parse audit log line: ${line.substring(0, 100)}...`, {
            error,
            line: line.substring(0, 100),
          })
        }
      }

      return auditLogs
    } catch (error) {
      this.logger.warn(`Unable to read audit file ${filePath}:`, { error, filePath })
      return []
    }
  }

  private parseAuditLogEntry(data: any): RawAuditLogEntry | null {
    try {
      // Validate required fields
      if (!data.id || !data.timestamp || !data.operation || !data.actor || !data.traceId) {
        return null
      }

      return {
        id: data.id,
        timestamp: data.timestamp,
        operation: data.operation,
        operationId: data.operationId || data.operation,
        resourceType: data.resourceType || data.entityType || 'Unknown',
        entityType: data.entityType || data.resourceType || 'Unknown',
        entityId: data.entityId,
        actor: {
          type: data.actor.type,
          id: data.actor.id,
        },
        source: data.source || 'unknown',
        traceId: data.traceId,
        before: data.before,
        after: data.after,
        changes: data.changes,
        success: data.success !== false, // Default to true if not specified
        errorMessage: data.error?.message || data.errorMessage,
        duration: data.duration,
      }
    } catch (error) {
      this.logger.warn('Failed to parse audit log entry:', { error, data })
      return null
    }
  }

  private applyFilters(auditLogs: RawAuditLogEntry[], filters: AuditFilters): RawAuditLogEntry[] {
    return auditLogs.filter(log => {
      // Operation filter
      if (filters.operation && !filters.operation.includes(log.operation)) {
        return false
      }

      // Operation ID filter
      if (filters.operationId && log.operationId !== filters.operationId) {
        return false
      }

      // Resource type filter
      if (filters.resourceType && log.resourceType !== filters.resourceType) {
        return false
      }

      // Entity ID filter
      if (filters.entityId && log.entityId !== filters.entityId) {
        return false
      }

      // Actor type filter
      if (filters.actorType && log.actor.type !== filters.actorType) {
        return false
      }

      // Actor ID filter
      if (filters.actorId && log.actor.id !== filters.actorId) {
        return false
      }

      // Source filter
      if (filters.source && log.source !== filters.source) {
        return false
      }

      // Trace ID filter
      if (filters.traceId && log.traceId !== filters.traceId) {
        return false
      }

      // Success filter
      if (filters.success !== undefined && log.success !== filters.success) {
        return false
      }

      // Time range filters
      if (filters.startTime && new Date(log.timestamp) < filters.startTime) {
        return false
      }

      if (filters.endTime && new Date(log.timestamp) > filters.endTime) {
        return false
      }

      return true
    })
  }
}
