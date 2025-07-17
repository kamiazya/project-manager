/**
 * Utility Types for Enhanced Type Safety
 *
 * This module provides utility types that enhance type safety and
 * provide better developer experience with TypeScript.
 */

/**
 * Make all properties required (opposite of Partial)
 */
export type Required<T> = {
  [P in keyof T]-?: T[P]
}

/**
 * Make all properties readonly (deep readonly)
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Make all properties mutable (opposite of Readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Make all properties optional (deep partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Pick only the properties that are not null or undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract only the keys of type T that have values of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Create a type with all properties from T except those in K
 */
export type Except<T, K extends keyof T> = Omit<T, K>

/**
 * Create a type that includes only the properties in K from T
 */
export type Only<T, K extends keyof T> = Pick<T, K>

/**
 * Create a type that makes some properties optional and others required
 */
export type OptionalRequired<T, O extends keyof T, R extends keyof T> = Omit<T, O | R> &
  Partial<Pick<T, O>> &
  Required<Pick<T, R>>

/**
 * Type for ensuring at least one property is present
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

/**
 * Type for ensuring exactly one property is present
 */
export type ExactlyOne<T, U = { [K in keyof T]: Pick<T, K> }> = U[keyof U]

/**
 * Type for creating a union of all property values
 */
export type ValueOf<T> = T[keyof T]

/**
 * Type for creating a union of all property keys as strings
 */
export type KeysAsStrings<T> = Extract<keyof T, string>

/**
 * Type for creating nested property paths
 */
export type NestedKeyOf<T> = {
  [K in keyof T]: T[K] extends object
    ? K extends string | number
      ? `${K}` | `${K}.${NestedKeyOf<T[K]> extends string ? NestedKeyOf<T[K]> : never}`
      : never
    : K extends string | number
      ? `${K}`
      : never
}[keyof T]

/**
 * Type for getting the type of a nested property
 */
export type NestedValueOf<T, K extends NestedKeyOf<T>> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? T[Key] extends object
      ? Rest extends NestedKeyOf<T[Key]>
        ? NestedValueOf<T[Key], Rest>
        : never
      : never
    : never
  : K extends keyof T
    ? T[K]
    : never

/**
 * Type for creating a discriminated union
 */
export type DiscriminatedUnion<T, K extends keyof T> = T extends { [P in K]: infer U }
  ? { [P in K]: U } & T
  : never

/**
 * Type for ensuring a type is serializable (JSON compatible)
 */
export type Serializable<T> = {
  [K in keyof T]: T[K] extends string | number | boolean | null | undefined
    ? T[K]
    : T[K] extends object
      ? Serializable<T[K]>
      : never
}

/**
 * Type for creating a configuration builder pattern
 */
export type ConfigurationBuilder<T> = {
  [K in keyof T]: (value: T[K]) => ConfigurationBuilder<T>
} & {
  build(): T
}

/**
 * Type for creating a fluent API
 */
export type FluentAPI<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => FluentAPI<T>
    : (value: T[K]) => FluentAPI<T>
}

/**
 * Type for creating immutable operations
 */
export type ImmutableOperations<T> = {
  readonly [K in keyof T]: T[K] extends object ? ImmutableOperations<T[K]> : T[K]
}

/**
 * Type for creating validation results
 */
export type ValidationResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      errors: string[]
    }

/**
 * Type for creating safe property access
 */
export type SafePropertyAccess<T, K extends keyof T> = T[K] extends null | undefined ? never : T[K]

/**
 * Type for creating conditional types based on property existence
 */
export type ConditionalType<T, K extends keyof T, TrueType, FalseType> = K extends keyof T
  ? TrueType
  : FalseType

/**
 * Type for creating a merge of two types
 */
export type Merge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U ? U[K] : K extends keyof T ? T[K] : never
}

/**
 * Type for creating a deep merge of two types
 */
export type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
      ? T[K]
      : never
}

/**
 * Type for creating a type-safe event emitter
 */
export type EventMap = Record<string, any[]>

export type EventEmitter<T extends EventMap> = {
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void
  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void
  emit<K extends keyof T>(event: K, ...args: T[K]): void
}

/**
 * Type for creating a type-safe state machine
 */
export type StateMachine<S extends string, E extends string> = {
  currentState: S
  transition(event: E): S | null
  canTransition(event: E): boolean
}
