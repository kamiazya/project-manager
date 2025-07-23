/**
 * Trace context type definitions for distributed tracing and correlation.
 *
 * Provides type-safe structures for tracking operations across system boundaries,
 * enabling end-to-end visibility and debugging capabilities.
 */

import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Core trace context interface for operation correlation.
 */
export interface TraceContext {
  /** Unique trace identifier that follows an operation across all systems */
  traceId: string

  /** Unique span identifier for this specific operation */
  spanId: string

  /** Parent span identifier (if this is a child operation) */
  parentSpanId?: string

  /** Sampling decision for this trace */
  sampled?: boolean

  /** Additional baggage data to propagate */
  baggage?: Record<string, string>

  /** Trace flags for additional control */
  flags?: TraceFlags
}

/**
 * Extended trace context with additional metadata.
 */
export interface ExtendedTraceContext extends TraceContext {
  /** Root operation that started this trace */
  rootOperation?: string

  /** Current depth in the operation tree */
  depth?: number

  /** Maximum depth allowed for this trace */
  maxDepth?: number

  /** Trace creation timestamp */
  startTime?: number

  /** Expected trace timeout (in milliseconds) */
  timeout?: number

  /** Tags associated with this trace */
  tags?: Record<string, string>

  /** Priority level for this trace */
  priority?: TracePriority
}

/**
 * Trace flags for controlling trace behavior.
 */
export interface TraceFlags {
  /** Whether this trace should be recorded */
  recorded?: boolean

  /** Whether this trace contains sensitive data */
  sensitive?: boolean

  /** Whether this trace should use high priority processing */
  highPriority?: boolean

  /** Whether debug information should be included */
  debug?: boolean
}

/**
 * Priority levels for trace processing.
 */
export type TracePriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Span information for individual operations within a trace.
 */
export interface SpanInfo {
  /** Unique span identifier */
  spanId: string

  /** Parent span identifier */
  parentSpanId?: string

  /** Operation name for this span */
  operation: string

  /** Component or service generating this span */
  component: string

  /** Start timestamp of the operation */
  startTime: number

  /** End timestamp of the operation (if completed) */
  endTime?: number

  /** Duration in milliseconds (calculated or provided) */
  duration?: number

  /** Status of this span */
  status: SpanStatus

  /** Additional attributes for this span */
  attributes?: Record<string, unknown>

  /** Events that occurred during this span */
  events?: SpanEvent[]

  /** Links to other spans or traces */
  links?: SpanLink[]
}

/**
 * Status of a span operation.
 */
export interface SpanStatus {
  /** Status code */
  code: SpanStatusCode

  /** Human-readable status message */
  message?: string
}

/**
 * Span status codes following OpenTelemetry conventions.
 */
export type SpanStatusCode = 'unset' | 'ok' | 'error'

/**
 * Event that occurred during a span.
 */
export interface SpanEvent {
  /** Event name */
  name: string

  /** Timestamp when the event occurred */
  timestamp: number

  /** Additional attributes for this event */
  attributes?: Record<string, unknown>
}

/**
 * Link to another span or trace.
 */
export interface SpanLink {
  /** Trace context of the linked span */
  context: TraceContext

  /** Attributes describing the link relationship */
  attributes?: Record<string, string>
}

/**
 * Sampling configuration for traces.
 */
export interface TraceSamplingConfig {
  /** Default sampling rate (0.0 to 1.0) */
  defaultRate: number

  /** Sampling rates by operation type */
  operationRates?: Record<string, number>

  /** Always sample these operations */
  alwaysSample?: string[]

  /** Never sample these operations */
  neverSample?: string[]

  /** Maximum traces per second */
  maxTracesPerSecond?: number

  /** Sampling strategy */
  strategy: SamplingStrategy
}

/**
 * Sampling strategies for trace collection.
 */
export type SamplingStrategy =
  | 'probabilistic' // Random sampling based on probability
  | 'rate-limiting' // Fixed number of traces per time period
  | 'adaptive' // Dynamic sampling based on system load
  | 'tail-based' // Sampling decision made after trace completion

/**
 * Trace propagation headers for cross-system communication.
 */
export interface TracePropagationHeaders {
  /** W3C Trace Context traceparent header */
  traceparent: string

  /** W3C Trace Context tracestate header */
  tracestate?: string

  /** Custom baggage header */
  baggage?: string
}

/**
 * Correlation ID information for request tracking.
 */
export interface CorrelationInfo {
  /** Request correlation ID */
  correlationId: string

  /** Session correlation ID */
  sessionId?: string

  /** User correlation ID */
  userId?: string

  /** Business process correlation ID */
  processId?: string

  /** Tenant or organization ID */
  tenantId?: string
}

/**
 * Utility functions for working with trace contexts.
 */
export const TraceContextUtils = {
  /**
   * Generate a new trace ID following W3C format.
   */
  generateTraceId(): string {
    // Generate 16 bytes (128 bits) as hex string
    const bytes = new Uint8Array(16)

    // Check for crypto availability with fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256)
      }
    }

    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Generate a new span ID following W3C format.
   */
  generateSpanId(): string {
    // Generate 8 bytes (64 bits) as hex string
    const bytes = new Uint8Array(8)

    // Check for crypto availability with fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256)
      }
    }

    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Generate a simple correlation ID.
   */
  generateCorrelationId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `corr-${timestamp}-${random}`
  },

  /**
   * Create a W3C traceparent header from trace context.
   */
  createTraceparentHeader(context: TraceContext): string {
    const version = '00' // W3C version
    const flags = context.sampled ? '01' : '00' // Sampling flag

    return `${version}-${context.traceId}-${context.spanId}-${flags}`
  },

  /**
   * Parse a W3C traceparent header into trace context.
   */
  parseTraceparentHeader(traceparent: string): TraceContext | null {
    const parts = traceparent.split('-')

    if (parts.length !== 4) {
      return null
    }

    const [version, traceId, spanId, flags] = parts

    // Validate format
    if (
      version !== '00' ||
      traceId?.length !== 32 ||
      spanId?.length !== 16 ||
      flags?.length !== 2
    ) {
      return null
    }

    return {
      traceId: traceId!,
      spanId: spanId!,
      parentSpanId: undefined, // This becomes the parent for child spans
      sampled: flags === '01',
    }
  },

  /**
   * Create a child trace context.
   */
  createChildContext(parent: TraceContext): TraceContext {
    return {
      traceId: parent.traceId,
      spanId: this.generateSpanId(),
      parentSpanId: parent.spanId,
      sampled: parent.sampled,
      baggage: { ...parent.baggage },
      flags: { ...parent.flags },
    }
  },

  /**
   * Merge baggage from multiple contexts.
   */
  mergeBaggage(...baggages: (Record<string, string> | undefined)[]): Record<string, string> {
    const merged: Record<string, string> = {}

    for (const baggage of baggages) {
      if (baggage) {
        Object.assign(merged, baggage)
      }
    }

    return merged
  },

  /**
   * Check if a trace should be sampled based on configuration.
   */
  shouldSample(context: TraceContext, config: TraceSamplingConfig, operation?: string): boolean {
    // Explicit sampling decision
    if (context.sampled !== undefined) {
      return context.sampled
    }

    // Always sample certain operations
    if (operation && config.alwaysSample?.includes(operation)) {
      return true
    }

    // Never sample certain operations
    if (operation && config.neverSample?.includes(operation)) {
      return false
    }

    // Operation-specific rate
    if (operation && config.operationRates?.[operation] !== undefined) {
      return Math.random() < config.operationRates[operation]
    }

    // Default rate
    return Math.random() < config.defaultRate
  },

  /**
   * Calculate span duration.
   */
  calculateDuration(span: SpanInfo): number | undefined {
    if (span.endTime && span.startTime) {
      return span.endTime - span.startTime
    }

    if (span.duration) {
      return span.duration
    }

    return undefined
  },

  /**
   * Validate trace context format.
   */
  validateTraceContext(context: Partial<TraceContext>): string[] {
    const errors: string[] = []

    if (!context.traceId) {
      errors.push('Trace ID is required')
    } else if (context.traceId.length !== 32 || !/^[0-9a-f]+$/.test(context.traceId)) {
      errors.push('Trace ID must be 32 hex characters')
    }

    if (!context.spanId) {
      errors.push('Span ID is required')
    } else if (context.spanId.length !== 16 || !/^[0-9a-f]+$/.test(context.spanId)) {
      errors.push('Span ID must be 16 hex characters')
    }

    if (
      context.parentSpanId &&
      (context.parentSpanId.length !== 16 || !/^[0-9a-f]+$/.test(context.parentSpanId))
    ) {
      errors.push('Parent Span ID must be 16 hex characters')
    }

    return errors
  },

  /**
   * Extract trace information for logging.
   */
  extractForLogging(context: TraceContext): Record<string, unknown> {
    return {
      traceId: context.traceId,
      spanId: context.spanId,
      parentSpanId: context.parentSpanId,
      sampled: context.sampled,
    }
  },
} as const

/**
 * Global trace context manager for maintaining current context.
 * Uses AsyncLocalStorage for safe async context propagation.
 */
export class TraceContextManager {
  private static instance: TraceContextManager | null = null
  private asyncLocalStorage: AsyncLocalStorage<TraceContext>

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<TraceContext>()
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): TraceContextManager {
    if (!TraceContextManager.instance) {
      TraceContextManager.instance = new TraceContextManager()
    }
    return TraceContextManager.instance
  }

  /**
   * Get the current active trace context.
   */
  getCurrentContext(): TraceContext | null {
    return this.asyncLocalStorage.getStore() ?? null
  }

  /**
   * Set the current trace context.
   * Note: This method is provided for compatibility but should be used carefully.
   * Prefer using withContext() or withContextAsync() for proper context isolation.
   */
  setCurrentContext(context: TraceContext | null): void {
    if (context === null) {
      // Cannot set null context directly with AsyncLocalStorage
      // This is intentionally limited to encourage proper context management
      return
    }

    // This method has limited functionality with AsyncLocalStorage
    // It's provided for compatibility but doesn't provide async isolation
    console.warn(
      'TraceContextManager.setCurrentContext() has limited functionality with AsyncLocalStorage. Use withContext() instead.'
    )
  }

  /**
   * Push a new context onto the stack and make it current.
   * @deprecated Use withContext() or withContextAsync() instead for proper async safety.
   */
  pushContext(_context: TraceContext): void {
    console.warn(
      'TraceContextManager.pushContext() is deprecated. Use withContext() or withContextAsync() instead.'
    )
    // Legacy behavior - not recommended with AsyncLocalStorage
  }

  /**
   * Pop the current context and restore the previous one.
   * @deprecated Use withContext() or withContextAsync() instead for proper async safety.
   */
  popContext(): TraceContext | null {
    console.warn(
      'TraceContextManager.popContext() is deprecated. Use withContext() or withContextAsync() instead.'
    )
    return this.getCurrentContext()
  }

  /**
   * Execute a function within a specific trace context.
   * This provides proper async context isolation.
   */
  withContext<T>(context: TraceContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn)
  }

  /**
   * Execute an async function within a specific trace context.
   * This provides proper async context isolation.
   */
  async withContextAsync<T>(context: TraceContext, fn: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(context, fn)
  }
}
