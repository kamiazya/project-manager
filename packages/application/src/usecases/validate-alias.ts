import { type Ticket, TicketAlias } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Request for validating an alias
 */
export interface ValidateAliasRequest {
  /**
   * The alias to validate
   */
  alias: string

  /**
   * The type of alias to validate against
   */
  aliasType?: 'canonical' | 'custom'

  /**
   * Whether to check for uniqueness across all tickets
   */
  checkUniqueness?: boolean

  /**
   * Ticket ID to exclude from uniqueness check (for updates)
   */
  excludeTicketId?: string
}

/**
 * Response from alias validation
 */
export interface ValidateAliasResponse {
  /**
   * Whether the alias is valid
   */
  isValid: boolean

  /**
   * The validated alias value
   */
  alias: string

  /**
   * Validation results for different aspects
   */
  validation: {
    /**
     * Format validation (length, characters, etc.)
     */
    format: {
      isValid: boolean
      errors: string[]
    }

    /**
     * Uniqueness validation (if requested)
     */
    uniqueness?: {
      isUnique: boolean
      conflictingTicketId?: string
      conflictingAliasType?: 'canonical' | 'custom'
    }

    /**
     * Type-specific validation
     */
    typeSpecific?: {
      isValid: boolean
      errors: string[]
    }
  }

  /**
   * Overall validation errors
   */
  errors: string[]

  /**
   * Suggestions for fixing invalid aliases
   */
  suggestions: string[]
}

/**
 * Use case for validating aliases before creation or modification
 *
 * This use case provides comprehensive alias validation including:
 * - Format validation (length, characters, patterns)
 * - Uniqueness validation across all tickets
 * - Type-specific validation rules
 * - Helpful error messages and suggestions
 *
 * Business Rules:
 * - Aliases must follow TicketAlias validation rules
 * - Aliases must be unique across all tickets (if uniqueness check enabled)
 * - Different validation rules may apply for canonical vs custom aliases
 * - Provides detailed feedback for validation failures
 */
export class ValidateAliasUseCase extends BaseUseCase<ValidateAliasRequest, ValidateAliasResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {
    super()
  }

  /**
   * Execute the use case
   */
  async execute(request: ValidateAliasRequest): Promise<ValidateAliasResponse> {
    const errors: string[] = []
    const suggestions: string[] = []

    // Format validation
    const formatValidation = this.validateFormat(request.alias, request.aliasType)

    // Uniqueness validation (if requested)
    let uniquenessValidation: ValidateAliasResponse['validation']['uniqueness'] | undefined
    if (request.checkUniqueness) {
      uniquenessValidation = await this.validateUniqueness(request.alias, request.excludeTicketId)
    }

    // Type-specific validation
    const typeSpecificValidation = this.validateTypeSpecific(request.alias, request.aliasType)

    // Collect all errors
    errors.push(...formatValidation.errors)
    if (uniquenessValidation && !uniquenessValidation.isUnique) {
      errors.push(`Alias "${request.alias}" is already in use`)
    }
    if (typeSpecificValidation) {
      errors.push(...typeSpecificValidation.errors)
    }

    // Generate suggestions
    suggestions.push(
      ...this.generateSuggestions(request.alias, formatValidation, uniquenessValidation)
    )

    const isValid = errors.length === 0

    return {
      isValid,
      alias: request.alias,
      validation: {
        format: formatValidation,
        uniqueness: uniquenessValidation,
        typeSpecific: typeSpecificValidation,
      },
      errors,
      suggestions,
    }
  }

  /**
   * Validate alias format using TicketAlias validation
   */
  private validateFormat(alias: string, aliasType?: 'canonical' | 'custom') {
    const errors: string[] = []

    // Basic format validation
    if (!alias || alias.trim() === '') {
      errors.push('Alias cannot be empty')
      return { isValid: false, errors }
    }

    try {
      // Use TicketAlias validation
      TicketAlias.create(alias, aliasType || 'custom')
      return { isValid: true, errors: [] }
    } catch (error: any) {
      errors.push(error.message)
      return { isValid: false, errors }
    }
  }

  /**
   * Validate alias uniqueness across all tickets
   */
  private async validateUniqueness(alias: string, excludeTicketId?: string) {
    const existingTicket = await this.ticketRepository.findByAlias(alias)

    if (!existingTicket) {
      return { isUnique: true }
    }

    // If we're excluding a specific ticket (for updates), check if it's the same ticket
    if (excludeTicketId && existingTicket.id.value === excludeTicketId) {
      return { isUnique: true }
    }

    // Determine which type of alias conflicts
    const conflictingAliasType = this.determineConflictingAliasType(existingTicket, alias)

    return {
      isUnique: false,
      conflictingTicketId: existingTicket.id.value,
      conflictingAliasType,
    }
  }

  /**
   * Validate type-specific rules
   */
  private validateTypeSpecific(alias: string, aliasType?: 'canonical' | 'custom') {
    const errors: string[] = []

    if (aliasType === 'canonical') {
      // Canonical aliases might have specific rules
      if (alias.length < 4) {
        errors.push('Canonical aliases should be at least 4 characters long')
      }
    }

    if (aliasType === 'custom') {
      // Custom aliases might have specific rules
      if (alias.includes(' ')) {
        errors.push('Custom aliases cannot contain spaces')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generate helpful suggestions for invalid aliases
   */
  private generateSuggestions(
    alias: string,
    formatValidation: { isValid: boolean; errors: string[] },
    uniquenessValidation?: { isUnique: boolean }
  ): string[] {
    const suggestions: string[] = []

    if (!formatValidation.isValid) {
      if (alias.includes(' ')) {
        suggestions.push(`Try "${alias.replace(/\s+/g, '-')}" (replace spaces with dashes)`)
      }
      if (alias.length < 3) {
        suggestions.push('Try a longer alias (at least 3 characters)')
      }
      if (alias.length > 50) {
        suggestions.push('Try a shorter alias (maximum 50 characters)')
      }
    }

    if (uniquenessValidation && !uniquenessValidation.isUnique) {
      suggestions.push(`Try "${alias}-2" or "${alias}-alt" for a unique variation`)
      suggestions.push(`Add a prefix or suffix to make it unique`)
    }

    return suggestions
  }

  /**
   * Determine which type of alias conflicts with the search
   */
  private determineConflictingAliasType(
    ticket: Ticket,
    searchAlias: string
  ): 'canonical' | 'custom' {
    // Check canonical alias first
    if (ticket.aliases?.canonical && ticket.aliases.canonical.matches(searchAlias)) {
      return 'canonical'
    }

    // Must be a custom alias
    return 'custom'
  }
}
