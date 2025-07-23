/**
 * Event emitter abstraction for the application layer.
 * Defines the contract for event emission without implementation details.
 */

export type EventListener<T = any> = (data: T) => void

/**
 * Event emitter interface for application services.
 * Provides event-driven communication within the application layer.
 */
export interface ApplicationEventEmitter {
  /**
   * Emit an event with optional data.
   */
  emit(event: string, data?: any): void

  /**
   * Subscribe to an event.
   */
  on(event: string, listener: EventListener): void

  /**
   * Unsubscribe from an event.
   */
  off(event: string, listener: EventListener): void

  /**
   * Remove all listeners for a specific event or all events.
   */
  removeAllListeners(event?: string): void
}

/**
 * Event emitter factory interface.
 * Allows creating event emitter instances without coupling to specific implementations.
 */
export interface EventEmitterFactory {
  /**
   * Create a new event emitter instance.
   */
  create(): ApplicationEventEmitter
}
