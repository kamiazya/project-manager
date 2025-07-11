import { dequal } from 'dequal'

/**
 * Base class for Value Objects following DDD principles
 *
 * Value Objects are immutable objects without identity, defined by their attributes.
 * They encapsulate validation logic and ensure invariants are maintained.
 *
 * @example
 * ```typescript
 * class Email extends ValueObject<{ value: string }> {
 *   private constructor(props: { value: string }) {
 *     super(props)
 *   }
 *
 *   static create(value: string): Email {
 *     // Validation logic here
 *     if (!value.includes('@')) {
 *       throw new Error('Invalid email format')
 *     }
 *     return new Email({ value })
 *   }
 *
 *   get value(): string {
 *     return this.props.value
 *   }
 * }
 * ```
 */
export abstract class ValueObject<T extends object> {
  protected readonly props: T

  protected constructor(props: T) {
    this.props = Object.freeze(props)
  }

  /**
   * Check equality between two value objects
   * Value objects are equal if all their properties are deeply equal
   * Uses dequal for deep equality comparison
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false
    }
    if (vo.props === undefined) {
      return false
    }
    return dequal(this.props, vo.props)
  }

  /**
   * Get a string representation of the value object
   * Subclasses should override this method for custom string representation
   */
  public toString(): string {
    return JSON.stringify(this.props)
  }
}
