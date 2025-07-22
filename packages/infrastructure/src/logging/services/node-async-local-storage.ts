/**
 * Node.js implementation of AsyncLocalStorage for context propagation.
 *
 * This is an infrastructure-specific implementation that uses Node.js's
 * built-in AsyncLocalStorage for managing logging context across async operations.
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import type { AsyncContextStorage } from '@project-manager/application'

/**
 * Node.js specific implementation of AsyncLocalStorage.
 * This class provides the actual context storage mechanism.
 */
export class NodeAsyncLocalStorage<T> implements AsyncContextStorage<T> {
  private storage: AsyncLocalStorage<T>

  constructor() {
    this.storage = new AsyncLocalStorage<T>()
  }

  /**
   * Run a function with the given context.
   * The context will be available to all async operations within the function.
   */
  run<R>(context: T, fn: () => R): R {
    return this.storage.run(context, fn)
  }

  /**
   * Get the current context, if any.
   * Returns undefined if not running within a context.
   */
  getStore(): T | undefined {
    return this.storage.getStore()
  }

  /**
   * Exit the current context.
   * Useful for cleanup or when you want to ensure no context leaks.
   */
  exit<R>(fn: () => R): R {
    return this.storage.exit(fn)
  }

  /**
   * Disable the AsyncLocalStorage instance.
   * All subsequent calls to getStore will return undefined.
   */
  disable(): void {
    this.storage.disable()
  }
}

/**
 * Factory function to create a Node.js AsyncLocalStorage instance.
 * This is what will be injected into the application layer.
 */
export function createNodeAsyncLocalStorage<T>(): NodeAsyncLocalStorage<T> {
  return new NodeAsyncLocalStorage<T>()
}

/**
 * Default export for convenient access
 */
export default NodeAsyncLocalStorage
