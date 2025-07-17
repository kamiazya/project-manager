/**
 * Ticket Configuration Schema
 *
 * Defines the structure and validation for ticket-related configuration
 * settings. This is part of the Shared Kernel since ticket concepts
 * are shared across bounded contexts.
 */

/**
 * Priority levels for tickets
 */
export type TicketPriority = 'high' | 'medium' | 'low'

/**
 * Ticket types for categorization
 */
export type TicketType = 'feature' | 'bug' | 'task'

/**
 * Ticket lifecycle states
 */
export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'archived'

/**
 * Privacy levels for tickets
 */
export type TicketPrivacy = 'public' | 'team' | 'local-only'

/**
 * Configuration schema for ticket management
 */
export interface TicketConfigSchema {
  /**
   * Default priority when creating new tickets
   */
  readonly defaultPriority: TicketPriority

  /**
   * Default type when creating new tickets
   */
  readonly defaultType: TicketType

  /**
   * Default status when creating new tickets
   */
  readonly defaultStatus: TicketStatus

  /**
   * Default privacy level when creating new tickets
   */
  readonly defaultPrivacy: TicketPrivacy

  /**
   * Maximum length for ticket titles
   */
  readonly maxTitleLength: number

  /**
   * Maximum length for ticket descriptions
   */
  readonly maxDescriptionLength: number

  /**
   * Enable auto-generation of ticket IDs
   */
  readonly autoGenerateIds: boolean

  /**
   * ID generation format (hex, uuid, sequential)
   */
  readonly idFormat: 'hex' | 'uuid' | 'sequential'

  /**
   * Length of generated IDs (for hex format)
   */
  readonly idLength: number
}

/**
 * Validation functions for ticket configuration
 */
export const TicketConfigValidation = {
  /**
   * Validate priority value
   */
  isValidPriority: (value: string): value is TicketPriority => {
    return ['high', 'medium', 'low'].includes(value)
  },

  /**
   * Validate type value
   */
  isValidType: (value: string): value is TicketType => {
    return ['feature', 'bug', 'task'].includes(value)
  },

  /**
   * Validate status value
   */
  isValidStatus: (value: string): value is TicketStatus => {
    return ['pending', 'in_progress', 'completed', 'archived'].includes(value)
  },

  /**
   * Validate privacy value
   */
  isValidPrivacy: (value: string): value is TicketPrivacy => {
    return ['public', 'team', 'local-only'].includes(value)
  },

  /**
   * Validate entire ticket configuration
   */
  isValidConfig: (config: unknown): config is TicketConfigSchema => {
    if (!config || typeof config !== 'object') return false

    const c = config as Record<string, unknown>

    return (
      typeof c.defaultPriority === 'string' &&
      TicketConfigValidation.isValidPriority(c.defaultPriority) &&
      typeof c.defaultType === 'string' &&
      TicketConfigValidation.isValidType(c.defaultType) &&
      typeof c.defaultStatus === 'string' &&
      TicketConfigValidation.isValidStatus(c.defaultStatus) &&
      typeof c.defaultPrivacy === 'string' &&
      TicketConfigValidation.isValidPrivacy(c.defaultPrivacy) &&
      typeof c.maxTitleLength === 'number' &&
      c.maxTitleLength > 0 &&
      typeof c.maxDescriptionLength === 'number' &&
      c.maxDescriptionLength > 0 &&
      typeof c.autoGenerateIds === 'boolean' &&
      typeof c.idFormat === 'string' &&
      ['hex', 'uuid', 'sequential'].includes(c.idFormat) &&
      typeof c.idLength === 'number' &&
      c.idLength > 0
    )
  },
}
