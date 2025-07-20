/**
 * Test to debug module resolution in development
 */

import { describe, it } from 'vitest'

describe('Module resolution debugging', () => {
  it('should show which files are being imported', async () => {
    console.log('=== Module Resolution Debug ===')

    // Test infrastructure module import
    const infrastructureModule = await import('@project-manager/infrastructure')

    console.log('Infrastructure exports:', Object.keys(infrastructureModule))

    // Check if JsonTicketRepository is available
    if (infrastructureModule.JsonTicketRepository) {
      console.log('JsonTicketRepository found in exports')

      // Create an instance and check its type
      const tempRepo = new infrastructureModule.JsonTicketRepository('/tmp/test')
      console.log('Instance created, constructor name:', tempRepo.constructor.name)
    } else {
      console.log('JsonTicketRepository NOT found in exports')
    }

    console.log('=== End Module Resolution Debug ===')
  })
})
