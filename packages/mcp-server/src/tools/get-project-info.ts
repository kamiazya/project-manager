import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { handleError } from '../utils/error-handler.js'

const getProjectInfoSchema = z.object({
  includePackageInfo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include package.json information'),
})

export const getProjectInfoTool = {
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

            projectInfo += `Package Information:\n`
            projectInfo += `Name: ${packageJson.name || 'N/A'}\n`
            projectInfo += `Version: ${packageJson.version || 'N/A'}\n`
            projectInfo += `Description: ${packageJson.description || 'N/A'}\n`

            if (packageJson.scripts) {
              projectInfo += `Scripts: ${Object.keys(packageJson.scripts).join(', ')}\n`
            }

            if (packageJson.dependencies) {
              projectInfo += `Dependencies: ${Object.keys(packageJson.dependencies).length} packages\n`
            }

            if (packageJson.devDependencies) {
              projectInfo += `Dev Dependencies: ${Object.keys(packageJson.devDependencies).length} packages\n`
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
