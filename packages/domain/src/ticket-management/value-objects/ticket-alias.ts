import { ValidationError } from '@project-manager/base'
import { ValueObject } from '../../shared/patterns/base-value-object.ts'
import type { AliasType } from '../types/alias-types.ts'

interface TicketAliasProps {
  value: string
  type: AliasType
}

// Alias format constraints
const MIN_LENGTH = 3
const MAX_LENGTH = 50
const ALIAS_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/
const RESERVED_PATTERNS = [
  /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i, // Full ULID pattern (Crockford Base32)
  /^all$/i,
  /^new$/i,
  /^create$/i,
  /^list$/i,
  /^help$/i,
]

/**
 * Value object representing a Ticket Alias
 *
 * Aliases provide human-friendly identifiers for tickets as an alternative
 * to the full ULID. They can be system-generated (canonical) or user-defined
 * (custom).
 *
 * Constraints:
 * - 3-50 characters in length
 * - Alphanumeric characters and hyphens only
 * - Must start and end with alphanumeric character
 * - Case-insensitive (stored in lowercase)
 * - Cannot be a reserved word or match ULID pattern
 */
export class TicketAlias extends ValueObject<TicketAliasProps> {
  get value(): string {
    return this.props.value
  }

  get type(): AliasType {
    return this.props.type
  }

  private constructor(props: TicketAliasProps) {
    super(props)
  }

  /**
   * Create a TicketAlias with validation
   * @param alias - The alias string
   * @param type - Whether this is a canonical (system) or custom (user) alias
   * @throws {ValidationError} If the alias doesn't meet validation rules
   */
  public static create(alias: string, type: AliasType = 'custom'): TicketAlias {
    const normalizedAlias = alias.trim().toLowerCase()

    // Length validation
    if (normalizedAlias.length < MIN_LENGTH) {
      throw new ValidationError(
        `Alias must be at least ${MIN_LENGTH} characters long`,
        'ticketAlias',
        alias
      )
    }

    if (normalizedAlias.length > MAX_LENGTH) {
      throw new ValidationError(
        `Alias cannot exceed ${MAX_LENGTH} characters`,
        'ticketAlias',
        alias
      )
    }

    // Format validation
    if (!ALIAS_PATTERN.test(normalizedAlias)) {
      throw new ValidationError(
        'Alias must contain only alphanumeric characters and hyphens, and must start and end with an alphanumeric character',
        'ticketAlias',
        alias
      )
    }

    // Reserved word validation
    const isReserved = RESERVED_PATTERNS.some(pattern => pattern.test(normalizedAlias))
    if (isReserved) {
      throw new ValidationError('This alias is reserved and cannot be used', 'ticketAlias', alias)
    }

    // Check for consecutive hyphens
    if (normalizedAlias.includes('--')) {
      throw new ValidationError('Alias cannot contain consecutive hyphens', 'ticketAlias', alias)
    }

    return new TicketAlias({ value: normalizedAlias, type })
  }

  /**
   * Create a canonical (system-generated) alias
   * This method assumes the input is already validated by the generator
   */
  public static createCanonical(alias: string): TicketAlias {
    return new TicketAlias({ value: alias.toLowerCase(), type: 'canonical' })
  }

  /**
   * Reconstitute a TicketAlias from persistence
   * Assumes the alias is already valid (used when loading from storage)
   */
  public static fromValue(value: string, type: AliasType = 'custom'): TicketAlias {
    return new TicketAlias({ value: value.toLowerCase(), type })
  }

  /**
   * Check if this alias matches a given string (case-insensitive)
   */
  public matches(alias: string): boolean {
    return this.value === alias.toLowerCase()
  }

  /**
   * Get the string representation of the alias
   */
  public toString(): string {
    return this.value
  }

  /**
   * Check if this is a canonical (system-generated) alias
   */
  public isCanonical(): boolean {
    return this.type === 'canonical'
  }

  /**
   * Check if this is a custom (user-defined) alias
   */
  public isCustom(): boolean {
    return this.type === 'custom'
  }
}
