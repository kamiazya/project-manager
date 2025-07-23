/**
 * Audit Metadata Generator Service
 *
 * Automatically generates audit metadata based on UseCase class names and conventions.
 * This enables automatic audit trail generation without explicit configuration.
 */

/**
 * Audit metadata that defines how to automatically generate audit records
 * for a specific UseCase operation.
 */
export interface AuditMetadata {
  /**
   * Unique identifier for this operation type.
   * Examples: 'create-ticket', 'update-ticket-status', 'delete-project'
   */
  operationId: string

  /**
   * Type of operation being performed.
   * Examples: 'create', 'read', 'update', 'delete', 'search'
   */
  operationType: 'create' | 'read' | 'update' | 'delete' | 'search'

  /**
   * Type of resource being operated on.
   * Examples: 'Ticket', 'Project', 'User'
   */
  resourceType: string

  /**
   * Human-readable description of what this operation does.
   * Examples: 'Creates a new ticket', 'Updates ticket status', 'Retrieves system logs'
   */
  description: string

  /**
   * Display name for the UseCase (for logging purposes).
   * Examples: 'CreateTicket', 'UpdateTicketStatus', 'DeleteProject'
   */
  useCaseName: string

  /**
   * Function to extract the entity ID from the UseCase response.
   * Required for create/update/delete operations to link audit records to specific entities.
   */
  extractEntityId?: (response: any) => string | undefined

  /**
   * Function to extract the before state for update operations.
   * This is called before the UseCase execution to capture the current state.
   */
  extractBeforeState?: (request: any) => Promise<any>

  /**
   * Function to extract the after state for create/update operations.
   * By default, uses the UseCase response as the after state.
   */
  extractAfterState?: (request: any, response: any) => any

  /**
   * Indicates if this operation contains sensitive data that should be filtered
   * from audit logs. If true, sensitive fields will be redacted.
   */
  containsSensitiveData?: boolean

  /**
   * Custom fields to include in the audit record.
   * These will be merged with the standard audit fields.
   */
  additionalAuditFields?: (request: any, response?: any) => Record<string, any>

  /**
   * Risk level of this operation for compliance purposes.
   * High risk operations may require additional approval or logging.
   */
  riskLevel?: 'low' | 'medium' | 'high'

  /**
   * Data classification level for compliance.
   * Determines retention periods and access controls.
   */
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'

  /**
   * Whether this operation requires retention for compliance.
   * If true, audit records will be kept for extended periods.
   */
  requiresRetention?: boolean
}

/**
 * Service that generates audit metadata from UseCase class names.
 */
export class AuditMetadataGenerator {
  /**
   * Generate audit metadata from a UseCase instance.
   *
   * @param useCase - The UseCase instance
   * @returns Generated audit metadata
   */
  generateMetadata(useCase: any): AuditMetadata {
    const className = useCase.constructor.name
    const { operationType, resourceType } = this.parseClassName(className)

    return {
      operationId: this.generateOperationId(operationType, resourceType),
      operationType,
      resourceType,
      description: this.generateDescription(operationType, resourceType),
      useCaseName: className.replace(/UseCase$/, ''),
      extractEntityId: this.createDefaultEntityIdExtractor(resourceType),
      riskLevel: this.determineRiskLevel(operationType),
      dataClassification: 'internal',
      containsSensitiveData: false,
      requiresRetention: operationType === 'delete',
    }
  }

  /**
   * Parse class name to extract operation type and resource type.
   *
   * @param className - UseCase class name
   * @returns Parsed operation and resource types
   */
  private parseClassName(className: string): {
    operationType: AuditMetadata['operationType']
    resourceType: string
  } {
    // Remove 'UseCase' suffix
    const baseName = className.replace(/UseCase$/, '')

    // Common patterns
    const patterns: Array<
      [RegExp, AuditMetadata['operationType'], (match: RegExpMatchArray) => string]
    > = [
      // Create patterns
      [/^Create(.+)$/, 'create', match => match[1]],
      [/^Add(.+)$/, 'create', match => match[1]],
      [/^New(.+)$/, 'create', match => match[1]],

      // Read patterns
      [/^Get(.+)ById$/, 'read', match => match[1]],
      [/^Get(.+)$/, 'read', match => match[1]],
      [/^Fetch(.+)$/, 'read', match => match[1]],
      [/^Find(.+)$/, 'read', match => match[1]],
      [/^List(.+)$/, 'read', match => match[1]],

      // Update patterns
      [/^Update(.+)Status$/, 'update', () => 'Ticket'],
      [/^Update(.+)Content$/, 'update', () => 'Ticket'],
      [/^Update(.+)Priority$/, 'update', () => 'Ticket'],
      [/^Update(.+)$/, 'update', match => match[1]],
      [/^Edit(.+)$/, 'update', match => match[1]],
      [/^Modify(.+)$/, 'update', match => match[1]],
      [/^Change(.+)$/, 'update', match => match[1]],

      // Delete patterns
      [/^Delete(.+)$/, 'delete', match => match[1]],
      [/^Remove(.+)$/, 'delete', match => match[1]],
      [/^Archive(.+)$/, 'delete', match => match[1]],

      // Search patterns
      [/^Search(.+)$/, 'search', match => match[1]],
      [/^Query(.+)$/, 'search', match => match[1]],
      [/^Find(.+)By/, 'search', match => match[1]],
    ]

    for (const [pattern, operationType, extractResource] of patterns) {
      const match = baseName.match(pattern)
      if (match) {
        const resourceType = extractResource(match)
        return { operationType, resourceType: this.normalizeResourceType(resourceType) }
      }
    }

    // Default fallback
    return { operationType: 'read', resourceType: 'Unknown' }
  }

  /**
   * Normalize resource type name.
   *
   * @param resourceType - Raw resource type
   * @returns Normalized resource type
   */
  private normalizeResourceType(resourceType: string): string {
    // Handle plural forms
    if (resourceType.endsWith('s') && !resourceType.endsWith('ss')) {
      resourceType = resourceType.slice(0, -1)
    }

    // Common mappings
    const mappings: Record<string, string> = {
      TicketById: 'Ticket',
      Tickets: 'Ticket',
      Logs: 'Log',
      AuditLogs: 'AuditLog',
    }

    return mappings[resourceType] || resourceType
  }

  /**
   * Generate operation ID from operation type and resource type.
   *
   * @param operationType - Type of operation
   * @param resourceType - Type of resource
   * @returns Operation ID
   */
  private generateOperationId(operationType: string, resourceType: string): string {
    return `${operationType}-${resourceType.toLowerCase()}`
  }

  /**
   * Generate human-readable description.
   *
   * @param operationType - Type of operation
   * @param resourceType - Type of resource
   * @returns Description
   */
  private generateDescription(operationType: string, resourceType: string): string {
    const verb = operationType.charAt(0).toUpperCase() + operationType.slice(1)
    return `${verb}s a ${resourceType}`
  }

  /**
   * Create default entity ID extractor.
   *
   * @param resourceType - Type of resource
   * @returns Entity ID extractor function
   */
  private createDefaultEntityIdExtractor(
    resourceType: string
  ): (response: any) => string | undefined {
    return (response: any) => {
      // Common patterns for extracting IDs
      return response?.id || response?.entityId || response?.[`${resourceType.toLowerCase()}Id`]
    }
  }

  /**
   * Determine risk level based on operation type.
   *
   * @param operationType - Type of operation
   * @returns Risk level
   */
  private determineRiskLevel(
    operationType: AuditMetadata['operationType']
  ): AuditMetadata['riskLevel'] {
    switch (operationType) {
      case 'delete':
        return 'high'
      case 'update':
      case 'create':
        return 'medium'
      case 'read':
      case 'search':
        return 'low'
      default:
        return 'medium'
    }
  }
}

/**
 * Default instance
 */
export const auditMetadataGenerator = new AuditMetadataGenerator()
