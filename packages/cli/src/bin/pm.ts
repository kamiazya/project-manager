import 'reflect-metadata'
import { createCLI } from '../cli.js'

async function main() {
  try {
    const cli = createCLI()
    await cli.parseAsync(process.argv)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
