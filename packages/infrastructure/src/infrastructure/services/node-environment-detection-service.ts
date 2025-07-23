/**
 * Node.js implementation of EnvironmentDetectionService
 *
 * Detects environment mode based on Node.js environment variables
 * and runtime context.
 */

import type { EnvironmentDetectionService } from '@project-manager/application'
import type { EnvironmentMode } from '@project-manager/base'

/**
 * Node.js environment detection service implementation
 */
export class NodeEnvironmentDetectionService implements EnvironmentDetectionService {
  /**
   * Detect the current environment mode based on Node.js environment variables
   */
  detectEnvironment(): EnvironmentMode {
    // Test environment (highest priority)
    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      return 'testing'
    }

    // CI environment
    if (process.env.CI) {
      return 'production'
    }

    // Development environment
    if (process.env.NODE_ENV === 'development') {
      return 'development'
    }

    // Default to production
    return 'production'
  }

  /**
   * Resolve environment mode from user input or auto-detection
   */
  resolveEnvironment(mode?: EnvironmentMode | 'auto'): EnvironmentMode {
    if (!mode || mode === 'auto') {
      return this.detectEnvironment()
    }

    return mode
  }
}
