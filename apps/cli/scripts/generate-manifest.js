#!/usr/bin/env node
import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { getCatalogsFromWorkspaceManifest } from '@pnpm/catalogs.config'
import { createExportableManifest } from '@pnpm/exportable-manifest'
import { findWorkspacePackages } from '@pnpm/find-workspace-packages'
import { readWorkspaceManifest } from '@pnpm/workspace.read-manifest'

const execAsync = promisify(exec)

/**
 * Robustly find the workspace root by traversing up the directory tree
 * and looking for characteristic files that identify a pnpm workspace.
 *
 * @param {string} startDir - Directory to start searching from
 * @returns {string} - Absolute path to workspace root
 * @throws {Error} - If workspace root cannot be found
 */
function findWorkspaceRoot(startDir = process.cwd()) {
  let currentDir = resolve(startDir)
  const rootDir = resolve('/')

  while (currentDir !== rootDir) {
    // Check for workspace indicators in order of reliability
    const indicators = [
      'pnpm-workspace.yaml', // Primary pnpm workspace indicator
      'pnpm-lock.yaml', // pnpm lockfile indicates workspace root
      '.git', // Git root often matches workspace root
      'lerna.json', // Alternative workspace tool
      'rush.json', // Alternative workspace tool
    ]

    for (const indicator of indicators) {
      const indicatorPath = join(currentDir, indicator)
      if (existsSync(indicatorPath)) {
        // Additional validation: ensure this is actually a workspace root
        const packageJsonPath = join(currentDir, 'package.json')
        if (existsSync(packageJsonPath)) {
          return currentDir
        }
      }
    }

    // Move up one directory
    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      // Reached filesystem root without finding workspace
      break
    }
    currentDir = parentDir
  }

  throw new Error(`Could not find workspace root starting from: ${startDir}`)
}

async function generateManifest() {
  try {
    // Read workspace manifest and get catalogs
    const workspaceRoot = findWorkspaceRoot()
    const workspaceManifest = await readWorkspaceManifest(workspaceRoot)
    const catalogs = workspaceManifest ? getCatalogsFromWorkspaceManifest(workspaceManifest) : {}

    // Find all workspace packages automatically
    const workspacePackages = await findWorkspacePackages(workspaceRoot)

    // Create workspace directory mapping for dependency resolution
    const workspaceDir = new Map()
    for (const pkg of workspacePackages) {
      workspaceDir.set(pkg.manifest.name, pkg.dir)
    }

    // Options for createExportableManifest
    const exportOptions = {
      catalogs,
      modulesDir: 'node_modules',
      workspaceDir,
    }

    // Read and store original package data with deep copying for immutability
    const originalPackageData = new Map()

    // Process CLI package separately
    const cliPackagePath = join(workspaceRoot, 'apps/cli/package.json')
    const currentCliContent = await readFile(cliPackagePath, 'utf8')
    const currentCliPkg = JSON.parse(currentCliContent)
    originalPackageData.set('@project-manager/cli', {
      path: cliPackagePath,
      originalContent: structuredClone(currentCliPkg),
      originalPublishConfig: structuredClone(currentCliPkg.publishConfig),
    })

    // Process all workspace packages
    for (const pkg of workspacePackages) {
      // Skip CLI package as it's handled separately
      if (pkg.manifest.name === '@project-manager/cli') continue

      const manifestPath = `${pkg.dir}/package.json`
      const content = await readFile(manifestPath, 'utf8')
      const packageJson = JSON.parse(content)

      originalPackageData.set(pkg.manifest.name, {
        path: manifestPath,
        originalContent: structuredClone(packageJson),
        originalPublishConfig: structuredClone(packageJson.publishConfig),
      })
    }

    // Generate exportable manifests using pnpm's standard mechanism
    const transformedPackages = new Map()

    // Transform CLI package (change to workspace root to resolve dependencies)
    const originalCwd = process.cwd()
    process.chdir(workspaceRoot)

    const exportableCliManifest = await createExportableManifest(
      workspaceRoot,
      currentCliPkg,
      exportOptions
    )

    // Manually merge oclif publishConfig since createExportableManifest doesn't handle nested object merging
    if (currentCliPkg.publishConfig?.oclif) {
      exportableCliManifest.oclif = {
        ...exportableCliManifest.oclif,
        ...currentCliPkg.publishConfig.oclif,
      }
    }

    transformedPackages.set('@project-manager/cli', exportableCliManifest)

    // Transform workspace packages
    for (const pkg of workspacePackages) {
      if (pkg.manifest.name === '@project-manager/cli') continue

      const originalData = originalPackageData.get(pkg.manifest.name)
      const exportableManifest = await createExportableManifest(
        workspaceRoot,
        originalData.originalContent,
        exportOptions
      )
      transformedPackages.set(pkg.manifest.name, exportableManifest)
    }

    // Restore original working directory
    process.chdir(originalCwd)

    // Write transformed package.json files
    for (const [packageName, transformedManifest] of transformedPackages) {
      const originalData = originalPackageData.get(packageName)
      await writeFile(originalData.path, JSON.stringify(transformedManifest, null, 2))
    }

    try {
      // Generate manifest
      console.log('Generating oclif manifest using pnpm publishConfig mechanism...')
      const cliDir = join(workspaceRoot, 'apps/cli')
      const oclifCommand = `cd "${cliDir}" && npx oclif manifest`
      await execAsync(oclifCommand)
      console.log('Manifest generated successfully')
    } finally {
      // Restore all original package.json files with immutable restoration
      for (const [, originalData] of originalPackageData) {
        // Create a fresh copy with the original publishConfig restored
        const restoredPackage = structuredClone(originalData.originalContent)
        restoredPackage.publishConfig = structuredClone(originalData.originalPublishConfig)

        await writeFile(originalData.path, `${JSON.stringify(restoredPackage, null, 2)}\n`)
      }
    }
  } catch (error) {
    console.error('Error generating manifest:', error)
    process.exit(1)
  }
}

generateManifest()
