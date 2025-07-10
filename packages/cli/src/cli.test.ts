import 'reflect-metadata'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCLI } from './cli.js'
import { resetServiceContainer } from './utils/service-factory.js'

describe('CLI', () => {
  let tempDir: string
  let originalEnv: typeof process.env

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = await mkdtemp(join(tmpdir(), 'pm-cli-test-'))

    // Save original environment and set test storage path
    originalEnv = { ...process.env }
    process.env.PM_STORAGE_PATH = join(tempDir, 'tickets.json')

    // Reset service container for each test
    resetServiceContainer()

    // Mock console methods to capture output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv

    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })

    // Reset service container
    resetServiceContainer()

    // Restore console methods
    vi.restoreAllMocks()
  })

  describe('version and help', () => {
    it('should show version', async () => {
      const cli = createCLI()

      // Mock process.exit to prevent actual exit
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync(['node', 'pm', '--version'])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(exitSpy).toHaveBeenCalledWith(0)
    })

    it('should show help', async () => {
      const cli = createCLI()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync(['node', 'pm', '--help'])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('create command', () => {
    it('should create a ticket successfully', async () => {
      const cli = createCLI()

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Test Ticket',
        'Test Description',
        '--priority',
        'high',
        '--type',
        'bug',
      ])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Ticket created successfully with ID:')
      )
    })

    it('should handle validation errors', async () => {
      const cli = createCLI()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync([
          'node',
          'pm',
          'create',
          '', // Empty title
          'Test Description',
        ])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('Failed to create ticket:', 'Title is required')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('list command', () => {
    beforeEach(async () => {
      // Create some test tickets
      const cli = createCLI()

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Bug Fix',
        'Fix login issue',
        '--priority',
        'high',
        '--type',
        'bug',
      ])

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Feature Request',
        'Add search functionality',
        '--priority',
        'medium',
        '--type',
        'feature',
      ])

      // Clear console mocks after setup
      vi.clearAllMocks()
    })

    it('should list all tickets', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'list'])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found 2 ticket(s)'))
    })

    it('should filter tickets by priority', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'list', '--priority', 'high'])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found 1 ticket(s)'))
    })

    it('should filter tickets by type', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'list', '--type', 'bug'])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found 1 ticket(s)'))
    })

    it('should output JSON format', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'list', '--format', 'json'])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[[\s\S]*\]$/) // JSON array format
      )
    })
  })

  describe('show command', () => {
    let ticketId: string

    beforeEach(async () => {
      const cli = createCLI()

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Test Ticket',
        'Test Description',
        '--priority',
        'medium',
      ])

      // Extract ticket ID from console output
      const consoleLogs = (console.log as any).mock.calls
      const createOutput = consoleLogs.find((call: any[]) =>
        call[0]?.includes('Ticket created successfully with ID:')
      )
      ticketId = createOutput[0].match(/ID: ([a-f0-9]{8})/)[1]

      vi.clearAllMocks()
    })

    it('should show ticket details', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'show', ticketId])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test Ticket'))
    })

    it('should handle non-existent ticket', async () => {
      const cli = createCLI()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync(['node', 'pm', 'show', '12345678'])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith('Ticket not found: 12345678')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('should output JSON format', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'show', ticketId, '--json'])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\{[\s\S]*\}$/) // JSON object format
      )
    })
  })

  describe('update command', () => {
    let ticketId: string

    beforeEach(async () => {
      const cli = createCLI()

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Test Ticket',
        'Test Description',
        '--priority',
        'low',
      ])

      // Extract ticket ID from console output
      const consoleLogs = (console.log as any).mock.calls
      const createOutput = consoleLogs.find((call: any[]) =>
        call[0]?.includes('Ticket created successfully with ID:')
      )
      ticketId = createOutput[0].match(/ID: ([a-f0-9]{8})/)[1]

      vi.clearAllMocks()
    })

    it('should update ticket status', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'update', ticketId, '--status', 'in_progress'])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated status to in_progress.')
      )
    })

    it('should update ticket priority', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'update', ticketId, '--priority', 'high'])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Updated priority to high.'))
    })

    it('should handle no updates specified', async () => {
      const cli = createCLI()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync(['node', 'pm', 'update', ticketId])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(
        'No updates specified. Use --status or --priority to update ticket.'
      )
      expect(exitSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('delete command', () => {
    let ticketId: string

    beforeEach(async () => {
      const cli = createCLI()

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Test Ticket',
        'Test Description',
        '--priority',
        'low',
      ])

      // Extract ticket ID from console output
      const consoleLogs = (console.log as any).mock.calls
      const createOutput = consoleLogs.find((call: any[]) =>
        call[0]?.includes('Ticket created successfully with ID:')
      )
      ticketId = createOutput[0].match(/ID: ([a-f0-9]{8})/)[1]

      vi.clearAllMocks()
    })

    it('should delete ticket with force flag', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'delete', ticketId, '--force'])

      expect(console.log).toHaveBeenCalledWith(`Ticket ${ticketId} deleted successfully.`)
    })

    it('should show confirmation without force flag', async () => {
      const cli = createCLI()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await cli.parseAsync(['node', 'pm', 'delete', ticketId])
      } catch (_error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.log).toHaveBeenCalledWith('About to delete ticket: Test Ticket')
      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })

  describe('stats command', () => {
    beforeEach(async () => {
      const cli = createCLI()

      // Create tickets with different statuses and priorities
      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'High Priority Bug',
        'Critical issue',
        '--priority',
        'high',
        '--type',
        'bug',
      ])

      await cli.parseAsync([
        'node',
        'pm',
        'create',
        'Medium Priority Feature',
        'New feature',
        '--priority',
        'medium',
        '--type',
        'feature',
      ])

      vi.clearAllMocks()
    })

    it('should show ticket statistics', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'stats'])

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Ticket Statistics'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total: 2'))
    })

    it('should output JSON format', async () => {
      const cli = createCLI()

      await cli.parseAsync(['node', 'pm', 'stats', '--json'])

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\{[\s\S]*\}$/) // JSON object format
      )
    })
  })
})
