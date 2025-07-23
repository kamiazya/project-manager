/**
 * Simple event emitter implementation for the infrastructure layer.
 * Provides a Node.js-free event system for cross-platform compatibility.
 */

import type {
  ApplicationEventEmitter,
  EventEmitterFactory,
  EventListener,
} from '@project-manager/application'

/**
 * Simple event emitter implementation using Map-based storage.
 */
export class SimpleEventEmitter implements ApplicationEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map()

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      // Create a copy to avoid issues if listeners are modified during emission
      const listenersCopy = [...eventListeners]
      for (const listener of listenersCopy) {
        try {
          listener(data)
        } catch (error) {
          // Silently handle listener errors to avoid breaking other listeners
          console.error(`Error in event listener for '${event}':`, error)
        }
      }
    }
  }

  on(event: string, listener: EventListener): void {
    const existingListeners = this.listeners.get(event) || []
    existingListeners.push(listener)
    this.listeners.set(event, existingListeners)
  }

  off(event: string, listener: EventListener): void {
    const existingListeners = this.listeners.get(event)
    if (existingListeners) {
      const index = existingListeners.indexOf(listener)
      if (index !== -1) {
        existingListeners.splice(index, 1)
        if (existingListeners.length === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

/**
 * Factory for creating simple event emitter instances.
 */
export class SimpleEventEmitterFactory implements EventEmitterFactory {
  create(): ApplicationEventEmitter {
    return new SimpleEventEmitter()
  }
}

/**
 * Default event emitter factory instance.
 */
export const defaultEventEmitterFactory = new SimpleEventEmitterFactory()
