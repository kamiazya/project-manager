/**
 * Domain Configuration Adapter
 *
 * Adapts Base Package configuration to domain-specific defaults
 * following Clean Architecture principles
 */

import type { TicketConfigSchema } from '@project-manager/base'
import type {
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from '../types/ticket-types.ts'

/**
 * Domain-specific ticket defaults derived from configuration
 */
export interface TicketDomainDefaults {
  readonly type: TicketType
  readonly priority: TicketPriority
  readonly status: TicketStatus
  readonly privacy: TicketPrivacy
  readonly maxTitleLength: number
  readonly maxDescriptionLength: number
}

/**
 * Adapter to convert Base Package configuration to domain defaults
 */
export class TicketDefaultsAdapter {
  /**
   * Create domain defaults from configuration schema
   */
  static fromConfiguration(config: TicketConfigSchema): TicketDomainDefaults {
    return {
      type: config.defaultType,
      priority: config.defaultPriority,
      status: config.defaultStatus,
      privacy: config.defaultPrivacy,
      maxTitleLength: config.maxTitleLength,
      maxDescriptionLength: config.maxDescriptionLength,
    }
  }

  /**
   * Get domain defaults with fallback values
   */
  static getDefaults(config?: Partial<TicketConfigSchema>): TicketDomainDefaults {
    return {
      type: config?.defaultType || 'task',
      priority: config?.defaultPriority || 'medium',
      status: config?.defaultStatus || 'pending',
      privacy: config?.defaultPrivacy || 'local-only',
      maxTitleLength: config?.maxTitleLength || 200,
      maxDescriptionLength: config?.maxDescriptionLength || 5000,
    }
  }
}
