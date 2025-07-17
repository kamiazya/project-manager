import * as fs from 'node:fs'
import * as os from 'node:os'
import * as sharedModule from '@project-manager/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProjectConfigTool } from './set-project-config.ts'

// Mock modules
vi.mock('@project-manager/shared')
vi.mock('node:fs')
vi.mock('node:os')

describe('setProjectConfigTool', () => {
  let mockResetConfig: ReturnType<typeof vi.fn>
  let mockValidateConfig: ReturnType<typeof vi.fn>
  let mockExistsSync: ReturnType<typeof vi.fn>
  let mockMkdirSync: ReturnType<typeof vi.fn>
  let mockReadFileSync: ReturnType<typeof vi.fn>
  let mockWriteFileSync: ReturnType<typeof vi.fn>
  let mockHomedir: ReturnType<typeof vi.fn>

  const DEFAULT_CONFIG: any = {
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
  }

  beforeEach(() => {
    mockResetConfig = vi.fn()
    mockValidateConfig = vi.fn().mockReturnValue([])
    mockExistsSync = vi.fn().mockReturnValue(true)
    mockMkdirSync = vi.fn()
    mockReadFileSync = vi.fn().mockReturnValue('{}')
    mockWriteFileSync = vi.fn()
    mockHomedir = vi.fn().mockReturnValue('/home/user')

    vi.spyOn(sharedModule, 'resetConfig').mockImplementation(mockResetConfig)
    vi.spyOn(sharedModule, 'validateConfig').mockImplementation(mockValidateConfig)
    vi.spyOn(sharedModule, 'DEFAULT_CONFIG', 'get').mockReturnValue(DEFAULT_CONFIG)
    vi.spyOn(fs, 'existsSync').mockImplementation(mockExistsSync)
    vi.spyOn(fs, 'mkdirSync').mockImplementation(mockMkdirSync)
    vi.spyOn(fs, 'readFileSync').mockImplementation(mockReadFileSync)
    vi.spyOn(fs, 'writeFileSync').mockImplementation(mockWriteFileSync)
    vi.spyOn(os, 'homedir').mockImplementation(mockHomedir)
    vi.spyOn(process, 'cwd').mockReturnValue('/project/dir')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(setProjectConfigTool.name).toBe('set_project_config')
    })

    it('should have correct description', () => {
      expect(setProjectConfigTool.description).toBe('Set a project configuration value')
    })

    it('should have correct input schema', () => {
      expect(setProjectConfigTool.inputSchema).toBeDefined()
      expect(typeof setProjectConfigTool.inputSchema).toBe('object')
    })
  })

  describe('Tool Handler', () => {
    it('should set a string configuration value in project config', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/project/dir/.pmrc.json',
        JSON.stringify({ defaultPriority: 'high' }, null, 2)
      )

      expect(mockResetConfig).toHaveBeenCalled()

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Configuration updated: defaultPriority = high'),
          },
        ],
      })

      expect(result.content[0].text).toContain('Config file: /project/dir/.pmrc.json')
    })

    it('should set a string configuration value in global config', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'defaultType',
        value: 'bug',
        global: true,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/home/user/.pmrc.json',
        JSON.stringify({ defaultType: 'bug' }, null, 2)
      )

      expect(result.content[0].text).toContain('Config file: /home/user/.pmrc.json')
    })

    it('should set a boolean configuration value (true variations)', async () => {
      const trueValues = ['true', 'True', 'TRUE', '1', 'yes', 'YES', 'on', 'ON']

      for (const value of trueValues) {
        mockWriteFileSync.mockClear()

        const result = await setProjectConfigTool.handler({
          key: 'confirmDeletion',
          value,
          global: false,
        })

        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/project/dir/.pmrc.json',
          JSON.stringify({ confirmDeletion: true }, null, 2)
        )

        expect(result.content[0].text).toContain('confirmDeletion = true')
      }
    })

    it('should set a boolean configuration value (false variations)', async () => {
      const falseValues = ['false', 'False', 'FALSE', '0', 'no', 'NO', 'off', 'OFF', 'invalid']

      for (const value of falseValues) {
        mockWriteFileSync.mockClear()

        const result = await setProjectConfigTool.handler({
          key: 'showHelpOnError',
          value,
          global: false,
        })

        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/project/dir/.pmrc.json',
          JSON.stringify({ showHelpOnError: false }, null, 2)
        )

        expect(result.content[0].text).toContain('showHelpOnError = false')
      }
    })

    it('should set a numeric configuration value', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'maxTitleLength',
        value: '500',
        global: false,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/project/dir/.pmrc.json',
        JSON.stringify({ maxTitleLength: 500 }, null, 2)
      )

      expect(result.content[0].text).toContain('maxTitleLength = 500')
    })

    it('should handle invalid numeric values', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'maxTitleLength',
        value: 'not-a-number',
        global: false,
      })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Invalid numeric value for maxTitleLength: not-a-number',
          },
        ],
        isError: true,
      })

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should handle invalid configuration keys', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'invalidKey',
        value: 'value',
        global: false,
      })

      expect(result.content[0].text).toContain('Invalid configuration key: invalidKey')
      expect(result.content[0].text).toContain('Valid keys are:')
      expect(result.isError).toBe(true)

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should validate configuration values', async () => {
      mockValidateConfig.mockReturnValue(['Invalid priority value'])

      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'invalid-priority',
        global: false,
      })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Configuration validation errors: Invalid priority value',
          },
        ],
        isError: true,
      })

      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('should merge with existing configuration', async () => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          defaultPriority: 'low',
          enableColorOutput: false,
        })
      )

      const result = await setProjectConfigTool.handler({
        key: 'defaultType',
        value: 'feature',
        global: false,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/project/dir/.pmrc.json',
        JSON.stringify(
          {
            defaultPriority: 'low',
            enableColorOutput: false,
            defaultType: 'feature',
          },
          null,
          2
        )
      )
    })

    it('should create config directory if it does not exist', async () => {
      mockExistsSync.mockImplementation(path => {
        if (path === '/project/dir') return false
        return true
      })

      await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(mockMkdirSync).toHaveBeenCalledWith('/project/dir', { recursive: true })
    })

    it('should handle file read errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to read existing config: Permission denied',
          },
        ],
        isError: true,
      })
    })

    it('should handle file write errors', async () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })

      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to set configuration: Disk full',
          },
        ],
        isError: true,
      })
    })

    it('should handle JSON parse errors', async () => {
      mockReadFileSync.mockReturnValue('invalid json{')

      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(result.content[0].text).toContain('Failed to read existing config')
      expect(result.isError).toBe(true)
    })

    it('should set storagePath configuration', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'storagePath',
        value: '/custom/storage/path',
        global: false,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/project/dir/.pmrc.json',
        JSON.stringify({ storagePath: '/custom/storage/path' }, null, 2)
      )

      expect(result.content[0].text).toContain('storagePath = /custom/storage/path')
    })

    it('should handle validation errors for complete config', async () => {
      mockValidateConfig
        .mockReturnValueOnce([]) // First validation passes
        .mockReturnValueOnce(['Multiple validation errors']) // Second validation fails

      const result = await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to set configuration: Configuration validation errors: Multiple validation errors',
          },
        ],
        isError: true,
      })
    })

    it('should handle different output formats', async () => {
      const formats = ['table', 'json', 'simple']

      for (const format of formats) {
        mockWriteFileSync.mockClear()

        const result = await setProjectConfigTool.handler({
          key: 'defaultOutputFormat',
          value: format,
          global: false,
        })

        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/project/dir/.pmrc.json',
          JSON.stringify({ defaultOutputFormat: format }, null, 2)
        )

        expect(result.content[0].text).toContain(`defaultOutputFormat = ${format}`)
      }
    })

    it('should handle date format configuration', async () => {
      const result = await setProjectConfigTool.handler({
        key: 'dateFormat',
        value: 'DD/MM/YYYY',
        global: false,
      })

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/project/dir/.pmrc.json',
        JSON.stringify({ dateFormat: 'DD/MM/YYYY' }, null, 2)
      )

      expect(result.content[0].text).toContain('dateFormat = DD/MM/YYYY')
    })

    it('should handle privacy settings', async () => {
      const privacyValues = ['local-only', 'team', 'public']

      for (const privacy of privacyValues) {
        mockWriteFileSync.mockClear()

        const result = await setProjectConfigTool.handler({
          key: 'defaultPrivacy',
          value: privacy,
          global: false,
        })

        expect(mockWriteFileSync).toHaveBeenCalledWith(
          '/project/dir/.pmrc.json',
          JSON.stringify({ defaultPrivacy: privacy }, null, 2)
        )

        expect(result.content[0].text).toContain(`defaultPrivacy = ${privacy}`)
      }
    })

    it('should properly format the written JSON', async () => {
      await setProjectConfigTool.handler({
        key: 'defaultPriority',
        value: 'high',
        global: false,
      })

      const writtenContent = mockWriteFileSync.mock.calls[0]![1]
      expect(writtenContent).toContain('\n')
      expect(writtenContent).toContain('  ') // Check for indentation
      expect(JSON.parse(writtenContent)).toEqual({ defaultPriority: 'high' })
    })
  })
})
