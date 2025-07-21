/**
 * Base class for Value Objects following DDD principles
 *
 * Value Objects are immutable objects without identity, defined by their attributes.
 * They encapsulate validation logic and ensure invariants are maintained.
 *
 * @example
 * ```typescript
 * import { ValidationError } from '@project-manager/base'
 *
 * class Email extends ValueObject<{ value: string }> {
 *   private constructor(props: { value: string }) {
 *     super(props)
 *   }
 *
 *   static create(value: string): Email {
 *     // Validation logic here
 *     if (!value.includes('@')) {
 *       throw new ValidationError('Invalid email format', 'email', value)
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
   * Value objects are equal if all their properties are equal
   * Uses simple property comparison suitable for value objects
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false
    }
    if (vo.props === undefined) {
      return false
    }

    // For simple value objects, compare JSON representations when possible
    try {
      return JSON.stringify(this.props) === JSON.stringify(vo.props)
    } catch {
      // Fallback to simple shallow comparison for objects that can't be serialized
      return this.shallowEquals(this.props, vo.props)
    }
  }

  /**
   * Get a string representation of the value object
   * Subclasses should override this method for custom string representation
   */
  public toString(): string {
    return JSON.stringify(this.props)
  }

  /**
   * Simple shallow equality check for objects that can't be JSON serialized
   */
  private shallowEquals(a: any, b: any): boolean {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== 'object' || typeof b !== 'object') return false

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (a[key] !== b[key]) return false
    }

    return true
  }
}
