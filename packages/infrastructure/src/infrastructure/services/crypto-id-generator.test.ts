import { beforeEach, describe, expect, it } from 'vitest'
import { CryptoIdGenerator } from './crypto-id-generator.ts'

describe('CryptoIdGenerator', () => {
  let generator: CryptoIdGenerator

  beforeEach(() => {
    generator = new CryptoIdGenerator()
  })

  describe('generateId', () => {
    it('should generate a valid 8-character hex ID (sync)', () => {
      const id = generator.generateId()

      expect(id).toHaveLength(8)
      expect(id).toMatch(/^[0-9a-f]{8}$/)
    })

    it('should generate different IDs on multiple calls', () => {
      const ids = [generator.generateId(), generator.generateId(), generator.generateId()]

      // All IDs should be different (collision unlikely with crypto randomness)
      expect(new Set(ids).size).toBe(3)
    })
  })
})
