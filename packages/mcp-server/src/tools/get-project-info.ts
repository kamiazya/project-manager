import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { handleError } from '../utils/error-handler.ts'

/**
 * Safely extracts a string property from an object, returning a default value if not found or invalid
 */
function safeStringProperty(obj: any, key: string, defaultValue: string = 'N/A'): string {
  return typeof obj?.[key] === 'string' ? obj[key] : defaultValue
}

/**
 * Safely checks if a property is a valid object (not null, not array)
 */
function isValidObject(value: any): boolean {
  return value && typeof value === 'object' && !Array.isArray(value)
}

const getProjectInfoSchema = z.object({
  includePackageInfo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include package.json information'),
})

export const getProjectInfoTool: McpTool = {
  name: 'get_project_info',
  title: 'Get Project Info',
  description: 'Get basic project information including README and package.json if available',
  inputSchema: getProjectInfoSchema.shape,
  handler: async (input: z.infer<typeof getProjectInfoSchema>) => {
    try {
      const { includePackageInfo } = input
      const cwd = process.cwd()

      let projectInfo = `Project Directory: ${cwd}\n\n`

      // Check for README files
      const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'readme.txt']
      let readmeFound = false

      for (const filename of readmeFiles) {
        const filepath = join(cwd, filename)
        if (existsSync(filepath)) {
          try {
            const content = readFileSync(filepath, 'utf-8')
            projectInfo += `${filename}:\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}\n\n`
            readmeFound = true
            break
          } catch (_error) {
            // Continue to next file
          }
        }
      }

      if (!readmeFound) {
        projectInfo += 'No README file found.\n\n'
      }

      // Check for package.json if requested
      if (includePackageInfo) {
        const packageJsonPath = join(cwd, 'package.json')
        if (existsSync(packageJsonPath)) {
          try {
            const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(packageJsonContent)

            // Validate that packageJson is an object and not null
            if (!isValidObject(packageJson)) {
              projectInfo += `Package.json found but contains invalid data.\n`
            } else {
              projectInfo += `Package Information:\n`

              // Safe access with type checking and default values
              projectInfo += `Name: ${safeStringProperty(packageJson, 'name')}\n`
              projectInfo += `Version: ${safeStringProperty(packageJson, 'version')}\n`
              projectInfo += `Description: ${safeStringProperty(packageJson, 'description')}\n`

              // Safe access to scripts object
              if (isValidObject(packageJson.scripts)) {
                try {
                  const scriptKeys = Object.keys(packageJson.scripts)
                  projectInfo += `Scripts: ${scriptKeys.join(', ')}\n`
                } catch {
                  projectInfo += `Scripts: Error reading scripts\n`
                }
              }

              // Safe access to dependencies object
              if (isValidObject(packageJson.dependencies)) {
                try {
                  const depCount = Object.keys(packageJson.dependencies).length
                  projectInfo += `Dependencies: ${depCount} packages\n`
                } catch {
                  projectInfo += `Dependencies: Error reading dependencies\n`
                }
              }

              // Safe access to devDependencies object
              if (isValidObject(packageJson.devDependencies)) {
                try {
                  const devDepCount = Object.keys(packageJson.devDependencies).length
                  projectInfo += `Dev Dependencies: ${devDepCount} packages\n`
                } catch {
                  projectInfo += `Dev Dependencies: Error reading dev dependencies\n`
                }
              }
            }
          } catch (_error) {
            projectInfo += `Package.json found but could not be parsed.\n`
          }
        } else {
          projectInfo += `No package.json found.\n`
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: projectInfo.trim(),
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to get project information: ${handleError(error).error}`,
          },
        ],
        isError: true,
      }
    }
  },
}
