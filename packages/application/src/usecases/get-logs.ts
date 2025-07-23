import type { ApplicationLogger, AuditableUseCase, AuditMetadata } from '../logging/index.ts'

export namespace GetLogs {
  /**
   * Log entry interface for response
   */
  export interface LogEntry {
    id: string
    timestamp: string
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    component?: string
    operation?: string
    traceId?: string
    userId?: string
    metadata?: Record<string, unknown>
  }

  /**
   * Request DTO for getting logs
   */
  export interface Request {
    readonly level?: 'debug' | 'info' | 'warn' | 'error'
    readonly component?: string
    readonly operation?: string
    readonly traceId?: string
    readonly startTime?: string // ISO date string
    readonly endTime?: string // ISO date string
    readonly limit?: number
    readonly offset?: number
  }

  /**
   * Response DTO for log retrieval
   */
  export class Response {
    constructor(
      public readonly logs: LogEntry[],
      public readonly totalCount: number,
      public readonly hasMore: boolean
    ) {}

    static create(logs: LogEntry[], totalCount: number, limit?: number): Response {
      let actualLogs = logs
      let hasMore = false

      if (limit && logs.length > limit) {
        // If we got more logs than requested, there are more available
        actualLogs = logs.slice(0, limit)
        hasMore = true
      }

      return new Response(actualLogs, totalCount, hasMore)
    }
  }

  /**
   * Use case for retrieving system logs with filtering capabilities.
   * This provides access to application logs for troubleshooting and monitoring.
   */
  export class UseCase implements AuditableUseCase<Request, Response> {
    public logger!: ApplicationLogger // Injected by framework

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'logs.read',
      operationType: 'read',
      resourceType: 'LogEntry',
      description: 'Retrieves system logs with optional filtering',
      useCaseName: 'GetLogs',

      extractBeforeState: async (request: Request) => {
        return {
          filters: {
            level: request.level,
            component: request.component,
            operation: request.operation,
            traceId: request.traceId,
          },
          timeRange: {
            startTime: request.startTime,
            endTime: request.endTime,
          },
          pagination: {
            limit: request.limit,
            offset: request.offset,
          },
        }
      },

      extractAfterState: async (_request: Request, response: Response) => {
        return {
          logsRetrieved: response.logs.length,
          totalCount: response.totalCount,
          hasMore: response.hasMore,
          logLevels: [...new Set(response.logs.map(log => log.level))],
          components: [...new Set(response.logs.map(log => log.component).filter(Boolean))],
        }
      },
    }

    constructor(private readonly logReader: LogReader) {}

    async execute(request: Request): Promise<Response> {
      await this.logger.info('Starting log retrieval', {
        hasLevelFilter: !!request.level,
        hasComponentFilter: !!request.component,
        hasOperationFilter: !!request.operation,
        hasTraceIdFilter: !!request.traceId,
        hasTimeRange: !!(request.startTime || request.endTime),
        limit: request.limit,
        offset: request.offset,
      })

      const filters: LogFilters = {
        level: request.level,
        component: request.component,
        operation: request.operation,
        traceId: request.traceId,
        startTime: request.startTime ? new Date(request.startTime) : undefined,
        endTime: request.endTime ? new Date(request.endTime) : undefined,
      }

      await this.logger.debug('Applying log filters', {
        filters: this.sanitizeFilters(filters),
      })

      // Fetch one extra log to determine if more logs exist beyond the requested limit
      const requestedLimit = request.limit || 100
      const fetchLimit = requestedLimit + 1

      const { logs, totalCount } = await this.logReader.getLogs(
        filters,
        fetchLimit,
        request.offset || 0
      )

      await this.logger.debug('Converting logs to response format', {
        rawLogCount: logs.length,
      })

      const logEntries = logs.map(log => this.convertToLogEntry(log))
      const response = Response.create(logEntries, totalCount, requestedLimit)

      await this.logger.info('Log retrieval completed', {
        logsRetrieved: response.logs.length,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
      })

      return response
    }

    private sanitizeFilters(filters: LogFilters): Record<string, unknown> {
      return {
        level: filters.level,
        component: filters.component,
        operation: filters.operation,
        traceId: filters.traceId,
        hasStartTime: !!filters.startTime,
        hasEndTime: !!filters.endTime,
      }
    }

    private convertToLogEntry(rawLog: RawLogEntry): LogEntry {
      return {
        id: rawLog.id,
        timestamp: rawLog.timestamp.toISOString(),
        level: rawLog.level,
        message: rawLog.message,
        component: rawLog.metadata?.component as string | undefined,
        operation: rawLog.metadata?.operation as string | undefined,
        traceId: rawLog.metadata?.traceId as string | undefined,
        userId: rawLog.metadata?.userId as string | undefined,
        metadata: rawLog.metadata,
      }
    }
  }
}

/**
 * Interface for log reading service
 */
export interface LogReader {
  getLogs(
    filters: LogFilters,
    limit: number,
    offset: number
  ): Promise<{ logs: RawLogEntry[]; totalCount: number }>
}

/**
 * Log filtering criteria
 */
export interface LogFilters {
  level?: 'debug' | 'info' | 'warn' | 'error'
  component?: string
  operation?: string
  traceId?: string
  startTime?: Date
  endTime?: Date
}

/**
 * Raw log entry from log storage
 */
export interface RawLogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}
