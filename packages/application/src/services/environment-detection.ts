/**
 * Environment detection service interface
 *
 * Provides abstractions for detecting and resolving environment modes
 * without depending on specific runtime environments.
 */

import type { EnvironmentMode } from '@project-manager/base'

/**
 * Service for detecting the current environment mode
 */
export interface EnvironmentDetectionService {
  /**
   * Detect the current environment mode based on runtime context
   * @returns The detected environment mode
   */
  detectEnvironment(): EnvironmentMode

  /**
   * Resolve environment mode from user input or auto-detection
   * @param mode User-specified mode or 'auto' for detection
   * @returns Resolved environment mode
   */
  resolveEnvironment(mode?: EnvironmentMode | 'auto'): EnvironmentMode
}
