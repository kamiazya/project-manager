import { getContainer as getCoreContainer } from '@project-manager/core'
import { getConfig } from '@project-manager/shared'

export function getContainer() {
  const config = getConfig()
  return getCoreContainer(config.storagePath)
}
