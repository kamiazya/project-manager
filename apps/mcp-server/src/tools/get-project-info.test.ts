import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getProjectInfoTool } from './get-project-info.ts'

// Mock modules
vi.mock('node:fs')
vi.mock('node:path')

describe('getProjectInfoTool', () => {
  let mockExistsSync: ReturnType<typeof vi.fn>
  let mockReadFileSync: ReturnType<typeof vi.fn>
  let mockJoin: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockExistsSync = vi.fn()
    mockReadFileSync = vi.fn()
    mockJoin = vi.fn()

    vi.spyOn(fs, 'existsSync').mockImplementation(mockExistsSync)
    vi.spyOn(fs, 'readFileSync').mockImplementation(mockReadFileSync)
    vi.spyOn(path, 'join').mockImplementation(mockJoin)
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project')

    // Default path.join behavior
    mockJoin.mockImplementation((...args) => args.join('/'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(getProjectInfoTool.name).toBe('get_project_info')
    })

    it('should have correct description', () => {
      expect(getProjectInfoTool.description).toBe(
        'Get basic project information including README and package.json if available'
      )
    })

    it('should have correct input schema', () => {
      expect(getProjectInfoTool.inputSchema).toBeDefined()
      expect(typeof getProjectInfoTool.inputSchema).toBe('object')
    })
  })

  describe('Tool Handler', () => {
    it('should return basic project directory information', async () => {
      mockExistsSync.mockReturnValue(false)

      const result = await getProjectInfoTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Project Directory: /test/project'),
          },
        ],
      })

      expect(result.content[0].text).toContain('No README file found.')
    })

    it('should find and include README.md content', async () => {
      const readmeContent = '# Test Project\n\nThis is a test project for unit testing.'

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/README.md'
      })
      mockReadFileSync.mockReturnValue(readmeContent)

      const result = await getProjectInfoTool.handler({})

      expect(result.content[0].text).toContain('README.md:')
      expect(result.content[0].text).toContain(readmeContent)
    })

    it('should find readme.md (lowercase) if README.md does not exist', async () => {
      const readmeContent = '# Test Project (lowercase)'

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/readme.md'
      })
      mockReadFileSync.mockReturnValue(readmeContent)

      const result = await getProjectInfoTool.handler({})

      expect(result.content[0].text).toContain('readme.md:')
      expect(result.content[0].text).toContain(readmeContent)
    })

    it('should truncate long README content', async () => {
      const longContent = 'a'.repeat(1500)

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/README.md'
      })
      mockReadFileSync.mockReturnValue(longContent)

      const result = await getProjectInfoTool.handler({})

      expect(result.content[0].text).toContain('a'.repeat(1000) + '...')
      expect(result.content[0].text).not.toContain('a'.repeat(1001))
    })

    it('should include package.json information when requested', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'A test project',
        scripts: {
          start: 'node index.js',
          test: 'jest',
          build: 'webpack',
        },
        dependencies: {
          express: '^4.18.0',
          lodash: '^4.17.0',
        },
        devDependencies: {
          jest: '^29.0.0',
        },
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Package Information:')
      expect(result.content[0].text).toContain('Name: test-project')
      expect(result.content[0].text).toContain('Version: 1.0.0')
      expect(result.content[0].text).toContain('Description: A test project')
      expect(result.content[0].text).toContain('Scripts: start, test, build')
      expect(result.content[0].text).toContain('Dependencies: 2 packages')
      expect(result.content[0].text).toContain('Dev Dependencies: 1 packages')
    })

    it('should not include package.json information when not requested', async () => {
      mockExistsSync.mockReturnValue(false)

      const result = await getProjectInfoTool.handler({ includePackageInfo: false })

      expect(result.content[0].text).not.toContain('Package Information:')
      expect(result.content[0].text).not.toContain('No package.json found.')
    })

    it('should handle missing package.json gracefully', async () => {
      mockExistsSync.mockReturnValue(false)

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('No package.json found.')
    })

    it('should handle invalid package.json gracefully', async () => {
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue('invalid json{')

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Package.json found but could not be parsed.')
    })

    it('should handle package.json with missing fields', async () => {
      const minimalPackageJson = {
        name: 'test-project',
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(minimalPackageJson))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Name: test-project')
      expect(result.content[0].text).toContain('Version: N/A')
      expect(result.content[0].text).toContain('Description: N/A')
    })

    it('should handle package.json with null values', async () => {
      const packageJsonWithNulls = {
        name: null,
        version: '1.0.0',
        description: undefined,
        scripts: null,
        dependencies: null,
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJsonWithNulls))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Name: N/A')
      expect(result.content[0].text).toContain('Version: 1.0.0')
      expect(result.content[0].text).toContain('Description: N/A')
    })

    it('should handle package.json as non-object', async () => {
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify('not an object'))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Package.json found but contains invalid data.')
    })

    it('should handle package.json as array', async () => {
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(['array', 'data']))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Package.json found but contains invalid data.')
    })

    it('should handle empty scripts object', async () => {
      const packageJson = {
        name: 'test-project',
        scripts: {},
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Scripts:')
      // Should handle empty object gracefully - no scripts to list
    })

    it('should handle both README and package.json', async () => {
      const readmeContent = '# Combined Test'
      const packageJson = { name: 'combined-test', version: '1.0.0' }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/README.md' || filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockImplementation(filepath => {
        if (filepath === '/test/project/README.md') return readmeContent
        if (filepath === '/test/project/package.json') return JSON.stringify(packageJson)
        return ''
      })

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('README.md:')
      expect(result.content[0].text).toContain(readmeContent)
      expect(result.content[0].text).toContain('Package Information:')
      expect(result.content[0].text).toContain('Name: combined-test')
    })

    it('should handle README file read errors gracefully', async () => {
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/README.md'
      })
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await getProjectInfoTool.handler({})

      expect(result.content[0].text).toContain('No README file found.')
    })

    it('should check multiple README file variations in order', async () => {
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/README.txt'
      })
      mockReadFileSync.mockReturnValue('README content from txt file')

      const result = await getProjectInfoTool.handler({})

      expect(result.content[0].text).toContain('README.txt:')
      expect(result.content[0].text).toContain('README content from txt file')
    })

    it('should handle general errors gracefully', async () => {
      vi.spyOn(process, 'cwd').mockImplementation(() => {
        throw new Error('Unable to determine current directory')
      })

      const result = await getProjectInfoTool.handler({})

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to get project information: Unable to determine current directory',
          },
        ],
        isError: true,
      })
    })

    it('should handle malformed scripts in package.json', async () => {
      const packageJson = {
        name: 'test-project',
        scripts: 'not an object',
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Name: test-project')
      // Should not crash on invalid scripts
    })

    it('should handle very large dependency objects', async () => {
      const largeDependencies: { [key: string]: string } = {}
      for (let i = 0; i < 1000; i++) {
        largeDependencies[`package-${i}`] = '^1.0.0'
      }

      const packageJson = {
        name: 'large-project',
        dependencies: largeDependencies,
      }

      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockReturnValue(JSON.stringify(packageJson))

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Dependencies: 1000 packages')
    })

    it('should handle circular references in package.json safely', async () => {
      // This would be handled by JSON.parse throwing an error
      mockExistsSync.mockImplementation(filepath => {
        return filepath === '/test/project/package.json'
      })
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Converting circular structure to JSON')
      })

      const result = await getProjectInfoTool.handler({ includePackageInfo: true })

      expect(result.content[0].text).toContain('Package.json found but could not be parsed.')
    })
  })
})
