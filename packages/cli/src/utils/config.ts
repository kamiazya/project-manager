import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { getStoragePath as getSharedStoragePath } from '@project-manager/shared'

/**
 * Get storage path and ensure the directory exists
 */
export function getStoragePath(): string {
  const storagePath = getSharedStoragePath()

  // Ensure directory exists
  const storageDir = dirname(storagePath)
  if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true })
  }

  return storagePath
}

/**
 * @deprecated Use getStoragePath() instead
 */
export function getDefaultStoragePath(): string {
  return getStoragePath()
}
