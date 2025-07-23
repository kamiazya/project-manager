import type { ApplicationLogger, AuditableUseCase, AuditMetadata } from '../logging/index.ts'

export namespace GetAuditLogs {
  /**
   * Actor information for audit entries
   */
  export interface AuditActor {
    type: 'human' | 'ai' | 'system'
    id: string
    name: string
    coAuthor?: string
  }

  /**
   * Audit log entry interface for response
   */
  export interface AuditLogEntry {
    id: string
    timestamp: string
    operation: 'create' | 'read' | 'update' | 'delete' | 'search'
    operationId: string
    resourceType: string
    entityId?: string
    actor: AuditActor
    source: 'cli' | 'mcp' | 'api' | 'test' | 'scheduler'
    traceId: string
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    changes?: Array<{
      field: string
      oldValue: unknown
      newValue: unknown
    }>
    success: boolean
    errorMessage?: string
    duration?: number
  }

  /**
   * Request DTO for getting audit logs
   */
  export interface Request {
    readonly operation?: 'create' | 'read' | 'update' | 'delete' | 'search'
    readonly operationId?: string
    readonly resourceType?: string
    readonly entityId?: string
    readonly actorType?: 'human' | 'ai' | 'system'
    readonly actorId?: string
    readonly source?: 'cli' | 'mcp' | 'api' | 'test' | 'scheduler'
    readonly traceId?: string
    readonly startTime?: string // ISO date string
    readonly endTime?: string // ISO date string
    readonly success?: boolean
    readonly limit?: number
    readonly offset?: number
  }

  /**
   * Response DTO for audit log retrieval
   */
  export class Response {
    constructor(
      public readonly auditLogs: AuditLogEntry[],
      public readonly totalCount: number,
      public readonly hasMore: boolean,
      public readonly summary: {
        operationCounts: Record<string, number>
        actorTypeCounts: Record<string, number>
        sourceCounts: Record<string, number>
        successRate: number
      }
    ) {}

    static create(auditLogs: AuditLogEntry[], totalCount: number, limit?: number): Response {
      const hasMore = limit ? auditLogs.length >= limit : false

      // Calculate summary statistics
      const operationCounts: Record<string, number> = {}
      const actorTypeCounts: Record<string, number> = {}
      const sourceCounts: Record<string, number> = {}
      let successCount = 0

      auditLogs.forEach(log => {
        operationCounts[log.operation] = (operationCounts[log.operation] || 0) + 1
        actorTypeCounts[log.actor.type] = (actorTypeCounts[log.actor.type] || 0) + 1
        sourceCounts[log.source] = (sourceCounts[log.source] || 0) + 1
        if (log.success) successCount++
      })

      const successRate = auditLogs.length > 0 ? (successCount / auditLogs.length) * 100 : 0

      const summary = {
        operationCounts,
        actorTypeCounts,
        sourceCounts,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      }

      return new Response(auditLogs, totalCount, hasMore, summary)
    }
  }

  /**
   * Use case for retrieving audit logs with filtering capabilities.
   * This provides access to audit trail for compliance and security monitoring.
   */
  export class UseCase implements AuditableUseCase<Request, Response> {
    public logger!: ApplicationLogger // Injected by framework

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'auditLogs.read',
      operationType: 'read',
      resourceType: 'AuditLogEntry',
      description: 'Retrieves audit logs with optional filtering',
      useCaseName: 'GetAuditLogs',

      extractBeforeState: async (request: Request) => {
        return {
          filters: {
            operation: request.operation,
            operationId: request.operationId,
            resourceType: request.resourceType,
            entityId: request.entityId,
            actorType: request.actorType,
            actorId: request.actorId,
            source: request.source,
            traceId: request.traceId,
            success: request.success,
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
          auditLogsRetrieved: response.auditLogs.length,
          totalCount: response.totalCount,
          hasMore: response.hasMore,
          summary: response.summary,
        }
      },
    }

    constructor(private readonly auditReader: AuditReader) {}

    async execute(request: Request): Promise<Response> {
      await this.logger.info('Starting audit log retrieval', {
        hasOperationFilter: !!request.operation,
        hasOperationIdFilter: !!request.operationId,
        hasResourceTypeFilter: !!request.resourceType,
        hasEntityIdFilter: !!request.entityId,
        hasActorFilter: !!(request.actorType || request.actorId),
        hasSourceFilter: !!request.source,
        hasTraceIdFilter: !!request.traceId,
        hasTimeRange: !!(request.startTime || request.endTime),
        hasSuccessFilter: request.success !== undefined,
        limit: request.limit,
        offset: request.offset,
      })

      const filters: AuditFilters = {
        operation: request.operation,
        operationId: request.operationId,
        resourceType: request.resourceType,
        entityId: request.entityId,
        actorType: request.actorType,
        actorId: request.actorId,
        source: request.source,
        traceId: request.traceId,
        startTime: request.startTime ? new Date(request.startTime) : undefined,
        endTime: request.endTime ? new Date(request.endTime) : undefined,
        success: request.success,
      }

      await this.logger.debug('Applying audit log filters', {
        filters: this.sanitizeFilters(filters),
      })

      const { auditLogs, totalCount } = await this.auditReader.getAuditLogs(
        filters,
        request.limit || 50,
        request.offset || 0
      )

      await this.logger.debug('Converting audit logs to response format', {
        rawAuditLogCount: auditLogs.length,
      })

      const auditLogEntries = auditLogs.map(log => this.convertToAuditLogEntry(log))
      const response = Response.create(auditLogEntries, totalCount, request.limit)

      await this.logger.info('Audit log retrieval completed', {
        auditLogsRetrieved: response.auditLogs.length,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        successRate: response.summary.successRate,
      })

      return response
    }

    private sanitizeFilters(filters: AuditFilters): Record<string, unknown> {
      return {
        operation: filters.operation,
        operationId: filters.operationId,
        resourceType: filters.resourceType,
        entityId: filters.entityId,
        actorType: filters.actorType,
        actorId: filters.actorId,
        source: filters.source,
        traceId: filters.traceId,
        hasStartTime: !!filters.startTime,
        hasEndTime: !!filters.endTime,
        success: filters.success,
      }
    }

    private convertToAuditLogEntry(rawAuditLog: RawAuditLogEntry): AuditLogEntry {
      return {
        id: rawAuditLog.id,
        timestamp: rawAuditLog.timestamp.toISOString(),
        operation: rawAuditLog.operation,
        operationId: rawAuditLog.operationId,
        resourceType: rawAuditLog.resourceType,
        entityId: rawAuditLog.entityId,
        actor: rawAuditLog.actor,
        source: rawAuditLog.source,
        traceId: rawAuditLog.traceId,
        before: rawAuditLog.before,
        after: rawAuditLog.after,
        changes: rawAuditLog.changes,
        success: rawAuditLog.success,
        errorMessage: rawAuditLog.errorMessage,
        duration: rawAuditLog.duration,
      }
    }
  }
}

/**
 * Interface for audit log reading service
 */
export interface AuditReader {
  getAuditLogs(
    filters: AuditFilters,
    limit: number,
    offset: number
  ): Promise<{ auditLogs: RawAuditLogEntry[]; totalCount: number }>
}

/**
 * Audit log filtering criteria
 */
export interface AuditFilters {
  operation?: 'create' | 'read' | 'update' | 'delete' | 'search'
  operationId?: string
  resourceType?: string
  entityId?: string
  actorType?: 'human' | 'ai' | 'system'
  actorId?: string
  source?: 'cli' | 'mcp' | 'api' | 'test' | 'scheduler'
  traceId?: string
  startTime?: Date
  endTime?: Date
  success?: boolean
}

/**
 * Raw audit log entry from audit storage
 */
export interface RawAuditLogEntry {
  id: string
  timestamp: Date
  operation: 'create' | 'read' | 'update' | 'delete' | 'search'
  operationId: string
  resourceType: string
  entityId?: string
  actor: GetAuditLogs.AuditActor
  source: 'cli' | 'mcp' | 'api' | 'test' | 'scheduler'
  traceId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changes?: Array<{
    field: string
    oldValue: unknown
    newValue: unknown
  }>
  success: boolean
  errorMessage?: string
  duration?: number
}
