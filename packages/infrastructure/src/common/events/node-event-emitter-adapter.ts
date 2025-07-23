/**
 * Node.js EventEmitter adapter for the infrastructure layer.
 * Provides compatibility with Node.js EventEmitter while maintaining clean architecture.
 */

import { EventEmitter } from 'node:events'
import type {
  ApplicationEventEmitter,
  EventEmitterFactory,
  EventListener,
} from '@project-manager/application'

/**
 * Adapter that wraps Node.js EventEmitter to implement ApplicationEventEmitter interface.
 */
export class NodeEventEmitterAdapter implements ApplicationEventEmitter {
  private nodeEmitter: EventEmitter

  constructor() {
    this.nodeEmitter = new EventEmitter()
  }

  emit(event: string, data?: any): void {
    this.nodeEmitter.emit(event, data)
  }

  on(event: string, listener: EventListener): void {
    this.nodeEmitter.on(event, listener)
  }

  off(event: string, listener: EventListener): void {
    this.nodeEmitter.off(event, listener)
  }

  removeAllListeners(event?: string): void {
    this.nodeEmitter.removeAllListeners(event)
  }

  /**
   * Get the underlying Node.js EventEmitter for advanced operations.
   * Use with caution as this breaks abstraction.
   */
  getNodeEmitter(): EventEmitter {
    return this.nodeEmitter
  }
}

/**
 * Factory for creating Node.js EventEmitter adapters.
 */
export class NodeEventEmitterFactory implements EventEmitterFactory {
  create(): ApplicationEventEmitter {
    return new NodeEventEmitterAdapter()
  }
}

/**
 * Node.js event emitter factory instance.
 */
export const nodeEventEmitterFactory = new NodeEventEmitterFactory()
