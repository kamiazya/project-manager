/**
 * Default Ticket Configuration
 *
 * Provides default values for ticket-related configuration settings.
 * These defaults represent sensible choices for most project management scenarios.
 */

import type { TicketConfigSchema } from '../../../kernel/configuration/schemas/ticket-config.ts'

/**
 * Default ticket configuration values
 */
export const DEFAULT_TICKET_CONFIG: TicketConfigSchema = {
  // Default Values
  defaultPriority: 'medium',
  defaultType: 'task',
  defaultStatus: 'pending',
  defaultPrivacy: 'local-only',

  // Validation Rules
  maxTitleLength: 200,
  maxDescriptionLength: 10000,

  // ID Generation
  autoGenerateIds: true,
  idFormat: 'timestamp',
  idLength: 13, // Timestamp length

  // Workflow Configuration
  allowStatusTransitions: {
    pending: ['in_progress', 'completed', 'archived'],
    in_progress: ['pending', 'completed', 'archived'],
    completed: ['pending', 'in_progress', 'archived'],
    archived: ['pending'], // Can only unarchive to pending
  },

  // Assignment Rules
  requireAssigneeForProgress: false,
  allowMultipleAssignees: false,

  // Notification Settings
  notifyOnStatusChange: true,
  notifyOnAssignmentChange: true,
  notifyOnPriorityChange: false,

  // Cross-cutting Features
  enableComments: true,
  enableAttachments: true,
  enableTasks: true,
  enableLabels: true,
  enableRelationships: true,

  // Auto-behavior
  autoArchiveCompletedAfterDays: 30,
  autoCloseStaleAfterDays: 90,
} as const

/**
 * Project type-specific configuration overrides
 */
export const PROJECT_TYPE_OVERRIDES: Record<string, Partial<TicketConfigSchema>> = {
  software: {
    defaultType: 'task',
    requireAssigneeForProgress: true,
    allowMultipleAssignees: true,
    idFormat: 'hex',
    idLength: 8,
  },

  design: {
    defaultType: 'task',
    enableAttachments: true,
    notifyOnStatusChange: false,
    idFormat: 'sequential',
    idLength: 4,
  },

  content: {
    defaultType: 'task',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    enableComments: true,
    idFormat: 'sequential',
  },

  research: {
    defaultType: 'task',
    maxDescriptionLength: 20000,
    autoArchiveCompletedAfterDays: 90,
    autoCloseStaleAfterDays: 180,
  },
} as const

/**
 * Team size-specific configuration overrides
 */
export const TEAM_SIZE_OVERRIDES: Record<string, Partial<TicketConfigSchema>> = {
  solo: {
    requireAssigneeForProgress: false,
    allowMultipleAssignees: false,
    notifyOnAssignmentChange: false,
    notifyOnStatusChange: false,
  },

  small: {
    requireAssigneeForProgress: true,
    allowMultipleAssignees: false,
    notifyOnAssignmentChange: true,
    notifyOnStatusChange: true,
  },

  large: {
    requireAssigneeForProgress: true,
    allowMultipleAssignees: true,
    notifyOnAssignmentChange: true,
    notifyOnStatusChange: true,
    notifyOnPriorityChange: true,
  },
} as const

/**
 * Get default configuration for a specific project type and team size
 */
export function getDefaultTicketConfig(
  projectType: string = 'software',
  teamSize: string = 'solo'
): TicketConfigSchema {
  const projectOverrides = PROJECT_TYPE_OVERRIDES[projectType] || {}
  const teamOverrides = TEAM_SIZE_OVERRIDES[teamSize] || {}

  return {
    ...DEFAULT_TICKET_CONFIG,
    ...projectOverrides,
    ...teamOverrides,
    // Merge complex objects
    allowStatusTransitions: {
      ...DEFAULT_TICKET_CONFIG.allowStatusTransitions,
      ...projectOverrides.allowStatusTransitions,
      ...teamOverrides.allowStatusTransitions,
    },
  }
}

/**
 * Ticket configuration validation helpers
 */
export class TicketConfigDefaults {
  /**
   * Get the default configuration
   */
  static getDefaults(): TicketConfigSchema {
    return { ...DEFAULT_TICKET_CONFIG }
  }

  /**
   * Get project type-specific defaults
   */
  static getProjectTypeDefaults(projectType: string): TicketConfigSchema {
    return getDefaultTicketConfig(projectType, 'solo')
  }

  /**
   * Get team size-specific defaults
   */
  static getTeamSizeDefaults(teamSize: string): TicketConfigSchema {
    return getDefaultTicketConfig('software', teamSize)
  }

  /**
   * Merge user configuration with defaults
   */
  static mergeWithDefaults(
    userConfig: Partial<TicketConfigSchema>,
    projectType: string = 'software',
    teamSize: string = 'solo'
  ): TicketConfigSchema {
    const defaults = getDefaultTicketConfig(projectType, teamSize)

    return {
      ...defaults,
      ...userConfig,
      // Ensure complex objects are properly merged
      allowStatusTransitions: {
        ...defaults.allowStatusTransitions,
        ...userConfig.allowStatusTransitions,
      },
    }
  }

  /**
   * Get workflow defaults
   */
  static getWorkflowDefaults(): Pick<
    TicketConfigSchema,
    'allowStatusTransitions' | 'requireAssigneeForProgress' | 'allowMultipleAssignees'
  > {
    return {
      allowStatusTransitions: DEFAULT_TICKET_CONFIG.allowStatusTransitions,
      requireAssigneeForProgress: DEFAULT_TICKET_CONFIG.requireAssigneeForProgress,
      allowMultipleAssignees: DEFAULT_TICKET_CONFIG.allowMultipleAssignees,
    }
  }

  /**
   * Get feature flag defaults
   */
  static getFeatureFlagDefaults(): Pick<
    TicketConfigSchema,
    'enableComments' | 'enableAttachments' | 'enableTasks' | 'enableLabels' | 'enableRelationships'
  > {
    return {
      enableComments: DEFAULT_TICKET_CONFIG.enableComments,
      enableAttachments: DEFAULT_TICKET_CONFIG.enableAttachments,
      enableTasks: DEFAULT_TICKET_CONFIG.enableTasks,
      enableLabels: DEFAULT_TICKET_CONFIG.enableLabels,
      enableRelationships: DEFAULT_TICKET_CONFIG.enableRelationships,
    }
  }
}
