import * as sharedModule from '@project-manager/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getProjectConfigTool } from './get-project-config.ts'

// Mock the shared module
vi.mock('@project-manager/shared')

describe('getProjectConfigTool', () => {
  let mockGetConfig: ReturnType<typeof vi.fn>
  let mockResetConfig: ReturnType<typeof vi.fn>

  const defaultConfig = {
    defaultPriority: 'medium',
    defaultType: 'task',
    defaultPrivacy: 'local-only',
    defaultStatus: 'pending',
    defaultOutputFormat: 'table',
    confirmDeletion: true,
    showHelpOnError: true,
    maxTitleLength: 200,
    dateFormat: 'YYYY-MM-DD',
    enableInteractiveMode: false,
    enableColorOutput: true,
    storagePath: '/home/user/.project-manager/data',
  }

  beforeEach(() => {
    mockGetConfig = vi.fn().mockReturnValue(defaultConfig)
    mockResetConfig = vi.fn()
    vi.spyOn(sharedModule, 'getConfig').mockImplementation(mockGetConfig)
    vi.spyOn(sharedModule, 'resetConfig').mockImplementation(mockResetConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(getProjectConfigTool.name).toBe('get_project_config')
    })

    it('should have correct description', () => {
      expect(getProjectConfigTool.description).toBe(
        'Get the current project configuration settings'
      )
    })

    it('should have correct input schema', () => {
      expect(getProjectConfigTool.inputSchema).toBeDefined()
      expect(typeof getProjectConfigTool.inputSchema).toBe('object')
      expect(Object.keys(getProjectConfigTool.inputSchema)).toHaveLength(0) // Empty schema
    })
  })

  describe('Tool Handler', () => {
    it('should return the default configuration', async () => {
      const result = await getProjectConfigTool.handler({})

      expect(mockResetConfig).toHaveBeenCalled()
      expect(mockGetConfig).toHaveBeenCalled()

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Current Project Configuration:'),
          },
        ],
      })

      expect(result.content[0].text).toContain('Default Priority: medium')
      expect(result.content[0].text).toContain('Default Type: task')
      expect(result.content[0].text).toContain('Default Privacy: local-only')
      expect(result.content[0].text).toContain('Default Status: pending')
      expect(result.content[0].text).toContain('Default Output Format: table')
      expect(result.content[0].text).toContain('Confirm Deletion: true')
      expect(result.content[0].text).toContain('Show Help on Error: true')
      expect(result.content[0].text).toContain('Max Title Length: 200')
      expect(result.content[0].text).toContain('Date Format: YYYY-MM-DD')
      expect(result.content[0].text).toContain('Enable Interactive Mode: false')
      expect(result.content[0].text).toContain('Enable Color Output: true')
      expect(result.content[0].text).toContain('Storage Path: /home/user/.project-manager/data')
    })

    it('should handle custom configuration values', async () => {
      const customConfig = {
        ...defaultConfig,
        defaultPriority: 'high',
        defaultType: 'bug',
        defaultPrivacy: 'shareable',
        defaultOutputFormat: 'json',
        confirmDeletion: false,
        enableInteractiveMode: true,
        storagePath: '/custom/path',
      }

      mockGetConfig.mockReturnValue(customConfig)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Default Priority: high')
      expect(result.content[0].text).toContain('Default Type: bug')
      expect(result.content[0].text).toContain('Default Privacy: shareable')
      expect(result.content[0].text).toContain('Default Output Format: json')
      expect(result.content[0].text).toContain('Confirm Deletion: false')
      expect(result.content[0].text).toContain('Enable Interactive Mode: true')
      expect(result.content[0].text).toContain('Storage Path: /custom/path')
    })

    it('should handle null storage path', async () => {
      const configWithNullPath = {
        ...defaultConfig,
        storagePath: null,
      }

      mockGetConfig.mockReturnValue(configWithNullPath)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Storage Path: default')
    })

    it('should handle undefined storage path', async () => {
      const configWithUndefinedPath = {
        ...defaultConfig,
        storagePath: undefined,
      }

      mockGetConfig.mockReturnValue(configWithUndefinedPath)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Storage Path: default')
    })

    it('should handle empty string storage path', async () => {
      const configWithEmptyPath = {
        ...defaultConfig,
        storagePath: '',
      }

      mockGetConfig.mockReturnValue(configWithEmptyPath)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Storage Path: default')
    })

    it('should reset config cache before getting config', async () => {
      await getProjectConfigTool.handler({})

      // Verify reset is called before get
      const resetCallOrder = mockResetConfig.mock.invocationCallOrder[0]
      const getCallOrder = mockGetConfig.mock.invocationCallOrder[0]
      expect(resetCallOrder).toBeLessThan(getCallOrder)
    })

    it('should handle errors when getting config', async () => {
      const error = new Error('Config file corrupted')
      mockGetConfig.mockImplementation(() => {
        throw error
      })

      const result = await getProjectConfigTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to get project configuration: Config file corrupted',
          },
        ],
        isError: true,
      })
    })

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied')
      error.name = 'PermissionError'
      mockGetConfig.mockImplementation(() => {
        throw error
      })

      const result = await getProjectConfigTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to get project configuration: Permission denied',
          },
        ],
        isError: true,
      })
    })

    it('should handle missing config file gracefully', async () => {
      const error = new Error('Config file not found')
      error.name = 'FileNotFoundError'
      mockGetConfig.mockImplementation(() => {
        throw error
      })

      const result = await getProjectConfigTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to get project configuration: Config file not found',
          },
        ],
        isError: true,
      })
    })

    it('should format boolean values correctly', async () => {
      const booleanConfig = {
        ...defaultConfig,
        confirmDeletion: true,
        showHelpOnError: false,
        enableInteractiveMode: true,
        enableColorOutput: false,
      }

      mockGetConfig.mockReturnValue(booleanConfig)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Confirm Deletion: true')
      expect(result.content[0].text).toContain('Show Help on Error: false')
      expect(result.content[0].text).toContain('Enable Interactive Mode: true')
      expect(result.content[0].text).toContain('Enable Color Output: false')
    })

    it('should handle various date formats', async () => {
      const dateFormats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM-DD-YYYY', 'ISO8601']

      for (const format of dateFormats) {
        const configWithDateFormat = {
          ...defaultConfig,
          dateFormat: format,
        }

        mockGetConfig.mockReturnValue(configWithDateFormat)

        const result = await getProjectConfigTool.handler({})

        expect(result.content[0].text).toContain(`Date Format: ${format}`)
      }
    })

    it('should handle long title lengths', async () => {
      const configWithLongTitle = {
        ...defaultConfig,
        maxTitleLength: 1000,
      }

      mockGetConfig.mockReturnValue(configWithLongTitle)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Max Title Length: 1000')
    })

    it('should handle concurrent calls', async () => {
      const promises = Array.from({ length: 10 }, () => getProjectConfigTool.handler({}))

      const results = await Promise.all(promises)

      expect(mockResetConfig).toHaveBeenCalledTimes(10)
      expect(mockGetConfig).toHaveBeenCalledTimes(10)

      results.forEach(result => {
        expect(result.content[0].text).toContain('Current Project Configuration:')
      })
    })

    it('should handle partial config objects', async () => {
      // Config missing some optional fields
      const partialConfig = {
        defaultPriority: 'low',
        defaultType: 'feature',
        confirmDeletion: true,
        maxTitleLength: 100,
      }

      mockGetConfig.mockReturnValue(partialConfig)

      const result = await getProjectConfigTool.handler({})

      expect(result.content[0].text).toContain('Default Priority: low')
      expect(result.content[0].text).toContain('Default Type: feature')
      expect(result.content[0].text).toContain('Confirm Deletion: true')
      expect(result.content[0].text).toContain('Max Title Length: 100')
      // Should handle undefined values gracefully
      expect(result.content[0].text).toContain('Storage Path: default')
    })

    it('should maintain consistent output format', async () => {
      const result = await getProjectConfigTool.handler({})

      // Check that the output follows a consistent format
      const lines = result.content[0].text.split('\n')
      expect(lines[0]).toBe('Current Project Configuration:')

      // Check each config line follows the "Key: Value" format
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          expect(lines[i]).toMatch(/^.+: .+$/)
        }
      }
    })
  })
})
