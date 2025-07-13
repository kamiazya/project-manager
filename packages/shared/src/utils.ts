import { randomBytes } from 'node:crypto'
import { ID_GENERATION } from './constants.ts'

/**
 * Generates a unique ID using crypto.randomBytes
 * Format: 8 hex characters for readability
 */
export function generateId(): string {
  return randomBytes(ID_GENERATION.RANDOM_BYTES).toString('hex')
}

/**
 * Validates if a string is a valid ID format
 */
export function isValidId(id: string): boolean {
  return ID_GENERATION.VALIDATION_PATTERN.test(id)
}
