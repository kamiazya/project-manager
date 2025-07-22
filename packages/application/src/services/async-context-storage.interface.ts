/**
 * AsyncContextStorage interface for context propagation.
 *
 * This interface abstracts the context storage mechanism,
 * allowing the application layer to use context propagation
 * without depending on specific implementations.
 */

/**
 * Interface for asynchronous context storage.
 * Implementations should provide thread-local storage for context data.
 */
export interface AsyncContextStorage<T> {
  /**
   * Run a function with the given context.
   * The context will be available to all async operations within the function.
   */
  run<R>(context: T, fn: () => R): R

  /**
   * Get the current context, if any.
   * Returns undefined if not running within a context.
   */
  getStore(): T | undefined

  /**
   * Exit the current context.
   * Useful for cleanup or when you want to ensure no context leaks.
   */
  exit<R>(fn: () => R): R

  /**
   * Disable the storage instance.
   * All subsequent calls to getStore will return undefined.
   */
  disable(): void
}
