import { beforeEach, describe, expect, it } from 'vitest'
import {
  CascadingConfigurationResolver,
  EnvironmentLoader,
  JsonFileLoader,
  OverrideLoader,
} from './index.ts'

describe('Configuration Infrastructure', () => {
  describe('EnvironmentLoader', () => {
    it('should load configuration from environment variables', async () => {
      const mockEnv = {
        PM_TICKET_DEFAULT_PRIORITY: 'high',
        PM_UI_ENABLE_COLOR_OUTPUT: 'true',
        PM_STORAGE_BACKUP_COUNT: '5',
      }

      const loader = new EnvironmentLoader('PM_', 100, mockEnv)
      const config = await loader.load()

      expect(config).toEqual({
        ticket: {
          default: {
            priority: 'high',
          },
        },
        ui: {
          enable: {
            color: {
              output: true,
            },
          },
        },
        storage: {
          backup: {
            count: 5,
          },
        },
      })
    })

    it('should handle different value types', async () => {
      const mockEnv = {
        PM_STRING_VAL: 'test',
        PM_BOOL_TRUE: 'true',
        PM_BOOL_FALSE: 'false',
        PM_NUMBER_INT: '123',
        PM_NUMBER_FLOAT: '12.34',
        PM_JSON_OBJECT: '{"key": "value"}',
      }

      const loader = new EnvironmentLoader('PM_', 100, mockEnv)
      const config = await loader.load()

      expect(config).toEqual({
        string: {
          val: 'test',
        },
        bool: {
          true: true,
          false: false,
        },
        number: {
          int: 123,
          float: 12.34,
        },
        json: {
          object: { key: 'value' },
        },
      })
    })
  })

  describe('OverrideLoader', () => {
    it('should load initial overrides', async () => {
      const initialOverrides = {
        ticket: { defaultPriority: 'high' },
        ui: { enableColorOutput: false },
      }

      const loader = new OverrideLoader(initialOverrides, 200)
      const config = await loader.load()

      expect(config).toEqual(initialOverrides)
    })

    it('should set and get override values', async () => {
      const loader = new OverrideLoader({}, 200)

      loader.setOverride('ticket.defaultPriority', 'high')
      loader.setOverride('ui.enableColorOutput', false)

      const config = await loader.load()

      expect(config).toEqual({
        ticket: { defaultPriority: 'high' },
        ui: { enableColorOutput: false },
      })

      expect(loader.getOverride('ticket.defaultPriority')).toBe('high')
      expect(loader.getOverride('ui.enableColorOutput')).toBe(false)
    })

    it('should remove overrides', async () => {
      const loader = new OverrideLoader(
        {
          ticket: { defaultPriority: 'high' },
          ui: { enableColorOutput: false },
        },
        200
      )

      loader.removeOverride('ticket.defaultPriority')

      const config = await loader.load()

      expect(config).toEqual({
        ticket: {},
        ui: { enableColorOutput: false },
      })
    })

    it('should clear all overrides', async () => {
      const loader = new OverrideLoader(
        {
          ticket: { defaultPriority: 'high' },
          ui: { enableColorOutput: false },
        },
        200
      )

      loader.clearOverrides()

      const config = await loader.load()

      expect(config).toEqual({})
    })
  })

  describe('CascadingConfigurationResolver', () => {
    let resolver: CascadingConfigurationResolver
    let overrideLoader: OverrideLoader
    let envLoader: EnvironmentLoader

    beforeEach(() => {
      overrideLoader = new OverrideLoader(
        {
          ticket: { defaultPriority: 'high' },
        },
        200
      )

      envLoader = new EnvironmentLoader('PM_', 100, {
        PM_TICKET_DEFAULT_TYPE: 'bug',
        PM_UI_ENABLE_COLOR_OUTPUT: 'true',
      })

      resolver = new CascadingConfigurationResolver([overrideLoader, envLoader])
    })

    it('should resolve configuration from multiple loaders', async () => {
      const config = await resolver.resolve()

      expect(config.ticket?.defaultPriority).toBe('high') // From override (higher priority)
      expect(config.ui?.enable?.color?.output).toBe(true) // From environment

      // Check that configuration is merged properly
      expect(config.ticket).toBeDefined()
      expect(config.ui).toBeDefined()
    })

    it('should respect loader priority', async () => {
      // Override has higher priority than environment
      overrideLoader.setOverride('ticket.defaultType', 'feature')

      const config = await resolver.resolve()

      expect(config.ticket?.defaultType).toBe('feature') // Override wins
    })

    it('should get specific values', async () => {
      const priority = await resolver.getValue('ticket.defaultPriority')
      const colorOutput = await resolver.getValue('ui.enable.color.output')
      const nonExistent = await resolver.getValue('nonexistent.key', 'default')

      expect(priority).toBe('high')
      expect(colorOutput).toBe(true)
      expect(nonExistent).toBe('default')
    })

    it('should check if values exist', async () => {
      const hasPriority = await resolver.hasValue('ticket.defaultPriority')
      const hasNonExistent = await resolver.hasValue('nonexistent.key')

      expect(hasPriority).toBe(true)
      expect(hasNonExistent).toBe(false)
    })

    it('should get detailed results', async () => {
      const results = await resolver.getDetailedResults()

      expect(results).toHaveLength(2)
      expect(results[0].priority).toBe(200) // Override loader (higher priority)
      expect(results[1].priority).toBe(100) // Environment loader
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })
})
