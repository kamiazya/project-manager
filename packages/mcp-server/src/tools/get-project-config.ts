import { getConfig, resetConfig } from '@project-manager/shared'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { handleError } from '../utils/error-handler.ts'

const getProjectConfigSchema = z.object({})

export const getProjectConfigTool: McpTool = {
  name: 'get_project_config',
  title: 'Get Project Config',
  description: 'Get the current project configuration settings',
  inputSchema: getProjectConfigSchema.shape,
  handler: async () => {
    try {
      // Reset cache to ensure fresh config is loaded
      resetConfig()
      const config = getConfig()

      return {
        content: [
          {
            type: 'text' as const,
            text: `Current Project Configuration:
Default Priority: ${config.defaultPriority}
Default Type: ${config.defaultType}
Default Privacy: ${config.defaultPrivacy}
Default Status: ${config.defaultStatus}
Default Output Format: ${config.defaultOutputFormat}
Confirm Deletion: ${config.confirmDeletion}
Show Help on Error: ${config.showHelpOnError}
Max Title Length: ${config.maxTitleLength}
Date Format: ${config.dateFormat}
Enable Interactive Mode: ${config.enableInteractiveMode}
Enable Color Output: ${config.enableColorOutput}
Storage Path: ${config.storagePath || 'default'}`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to get project configuration: ${handleError(error).error}`,
          },
        ],
        isError: true,
      }
    }
  },
}
