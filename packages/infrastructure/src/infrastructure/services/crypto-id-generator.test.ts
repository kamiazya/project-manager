import { beforeEach, describe, expect, it } from 'vitest'
import { CryptoIdGenerator } from './crypto-id-generator.ts'

describe('CryptoIdGenerator', () => {
  let generator: CryptoIdGenerator

  beforeEach(() => {
    generator = new CryptoIdGenerator()
  })

  describe('generateTicketId', () => {
    it('should generate a valid 8-character hex ID (async)', async () => {
      const id = await generator.generateTicketId()

      expect(id).toHaveLength(8)
      expect(id).toMatch(/^[0-9a-f]{8}$/)
    })

    it('should generate different IDs on multiple calls', async () => {
      const ids = await Promise.all([
        generator.generateTicketId(),
        generator.generateTicketId(),
        generator.generateTicketId(),
      ])

      // All IDs should be different (collision unlikely with crypto randomness)
      expect(new Set(ids).size).toBe(3)
    })
  })

  describe('generateTicketIdSync', () => {
    it('should generate a valid 8-character hex ID (sync)', () => {
      const id = generator.generateTicketIdSync()

      expect(id).toHaveLength(8)
      expect(id).toMatch(/^[0-9a-f]{8}$/)
    })

    it('should generate different IDs on multiple calls', () => {
      const ids = [
        generator.generateTicketIdSync(),
        generator.generateTicketIdSync(),
        generator.generateTicketIdSync(),
      ]

      // All IDs should be different (collision unlikely with crypto randomness)
      expect(new Set(ids).size).toBe(3)
    })
  })

  describe('isValidTicketIdFormat', () => {
    it('should return true for valid 8-character hex strings', () => {
      expect(CryptoIdGenerator.isValidTicketIdFormat('a1b2c3d4')).toBe(true)
      expect(CryptoIdGenerator.isValidTicketIdFormat('12345678')).toBe(true)
      expect(CryptoIdGenerator.isValidTicketIdFormat('abcdef01')).toBe(true)
      expect(CryptoIdGenerator.isValidTicketIdFormat('00000000')).toBe(true)
      expect(CryptoIdGenerator.isValidTicketIdFormat('ffffffff')).toBe(true)
    })

    it('should return false for invalid formats', () => {
      expect(CryptoIdGenerator.isValidTicketIdFormat('abc')).toBe(false) // Too short
      expect(CryptoIdGenerator.isValidTicketIdFormat('abcd12345')).toBe(false) // Too long
      expect(CryptoIdGenerator.isValidTicketIdFormat('abcdXYZ1')).toBe(false) // Invalid characters
      expect(CryptoIdGenerator.isValidTicketIdFormat('ABCD1234')).toBe(false) // Uppercase
      expect(CryptoIdGenerator.isValidTicketIdFormat('')).toBe(false) // Empty
      expect(CryptoIdGenerator.isValidTicketIdFormat('abcd-123')).toBe(false) // Special characters
    })
  })
})
