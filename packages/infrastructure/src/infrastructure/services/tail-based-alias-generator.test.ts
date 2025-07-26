import { TicketId } from '@project-manager/domain'
import { describe, expect, it } from 'vitest'
import { TailBasedAliasGenerator } from './tail-based-alias-generator.ts'

describe('TailBasedAliasGenerator', () => {
  const validUlid = '01H8XGJWBWBAQ1J3T3B8A0V0A8'

  describe('constructor', () => {
    it('should create generator with default length', () => {
      const generator = new TailBasedAliasGenerator()
      expect(generator.getMinLength()).toBe(8)
      expect(generator.getMaxLength()).toBe(8)
    })

    it('should create generator with custom length', () => {
      const generator = new TailBasedAliasGenerator(10)
      expect(generator.getMinLength()).toBe(10)
      expect(generator.getMaxLength()).toBe(10)
    })

    it('should throw error for length less than 4', () => {
      expect(() => new TailBasedAliasGenerator(3)).toThrow('at least 4 characters')
    })

    it('should throw error for length greater than 16', () => {
      expect(() => new TailBasedAliasGenerator(17)).toThrow('cannot exceed 16 characters')
    })
  })

  describe('generate', () => {
    it('should generate alias from ULID tail', () => {
      const generator = new TailBasedAliasGenerator(8)
      const ticketId = TicketId.create(validUlid)

      const alias = generator.generate(ticketId)

      expect(alias).toBe('b8a0v0a8') // Last 8 chars of ULID random part, lowercase
      expect(alias.length).toBe(8)
    })

    it('should generate different length aliases', () => {
      const ticketId = TicketId.create(validUlid)

      const gen6 = new TailBasedAliasGenerator(6)
      const gen12 = new TailBasedAliasGenerator(12)

      expect(gen6.generate(ticketId)).toBe('a0v0a8') // Last 6 chars of random part
      expect(gen12.generate(ticketId)).toBe('j3t3b8a0v0a8') // Last 12 chars of random part
    })

    it('should convert to lowercase', () => {
      const generator = new TailBasedAliasGenerator(8)
      const ulidWithUppercase = '01H8XGJWBWBAQ1J3T3B8A0V0A8'
      const ticketId = TicketId.create(ulidWithUppercase)

      const alias = generator.generate(ticketId)

      expect(alias).toBe('b8a0v0a8')
      expect(alias).not.toContain('A')
      expect(alias).not.toContain('B')
    })

    it('should throw error for invalid ULID length', () => {
      const generator = new TailBasedAliasGenerator(8)
      // Create a ticket ID with invalid length (this bypasses TicketId validation for testing)
      const invalidId = { value: 'SHORTULID' } as TicketId

      expect(() => generator.generate(invalidId)).toThrow('Invalid ULID format')
    })

    it('should generate consistent aliases for same ULID', () => {
      const generator = new TailBasedAliasGenerator(8)
      const ticketId = TicketId.create(validUlid)

      const alias1 = generator.generate(ticketId)
      const alias2 = generator.generate(ticketId)

      expect(alias1).toBe(alias2)
    })

    it('should generate different aliases for different ULIDs', () => {
      const generator = new TailBasedAliasGenerator(8)
      const ulid1 = '01H8XGJWBWBAQ1J3T3B8A0V0A8'
      const ulid2 = '01H8XGJWBWBAQ1J3T3B8A0V0B9'

      const ticketId1 = TicketId.create(ulid1)
      const ticketId2 = TicketId.create(ulid2)

      const alias1 = generator.generate(ticketId1)
      const alias2 = generator.generate(ticketId2)

      expect(alias1).not.toBe(alias2)
    })
  })

  describe('validate', () => {
    const generator = new TailBasedAliasGenerator(8)

    it('should validate correct length alias', () => {
      expect(generator.validate('b8a0v0a8')).toBe(true)
      expect(generator.validate('12345678')).toBe(true)
      expect(generator.validate('abcdefgh')).toBe(true)
    })

    it('should reject incorrect length alias', () => {
      expect(generator.validate('short')).toBe(false) // Too short
      expect(generator.validate('toolongalias')).toBe(false) // Too long
    })

    it('should validate Base32 characters', () => {
      expect(generator.validate('0123456z')).toBe(true) // Valid Base32
      expect(generator.validate('abcdefgh')).toBe(true) // Valid Base32
      expect(generator.validate('0123456!')).toBe(false) // Invalid character
      expect(generator.validate('01234567')).toBe(true) // Numbers ok
    })

    it('should accept both upper and lowercase', () => {
      expect(generator.validate('ABCDEFGH')).toBe(true)
      expect(generator.validate('abcdefgh')).toBe(true)
      expect(generator.validate('AbCdEfGh')).toBe(true)
    })

    it('should reject invalid Base32 characters', () => {
      // ULID excludes I, L, O, U to avoid ambiguity
      expect(generator.validate('12345678')).toBe(true)
      expect(generator.validate('1234567I')).toBe(false) // Contains I
      expect(generator.validate('1234567L')).toBe(false) // Contains L
      expect(generator.validate('1234567O')).toBe(false) // Contains O
      expect(generator.validate('1234567U')).toBe(false) // Contains U
    })
  })

  describe('getDescription', () => {
    it('should return meaningful description', () => {
      const generator = new TailBasedAliasGenerator(8)
      const description = generator.getDescription()

      expect(description).toContain('Tail-based')
      expect(description).toContain('8 chars')
      expect(description).toContain('ULID random part')
    })

    it('should include length in description', () => {
      const generator = new TailBasedAliasGenerator(12)
      const description = generator.getDescription()

      expect(description).toContain('12 chars')
    })
  })

  describe('collision probability calculations', () => {
    const generator = new TailBasedAliasGenerator(8)

    it('should calculate collision probability', () => {
      // For 8 characters (32^8 keyspace), 1000 tickets should have very low collision risk
      const prob1000 = generator.calculateCollisionProbability(1000)
      expect(prob1000).toBeLessThan(0.01) // Less than 1%

      // Large number of tickets should have higher collision risk
      const prob100000 = generator.calculateCollisionProbability(100000)
      expect(prob100000).toBeGreaterThan(prob1000)
    })

    it('should provide recommended ticket limits', () => {
      const limit1Percent = generator.getRecommendedTicketLimit(0.01)
      const limit10Percent = generator.getRecommendedTicketLimit(0.1)

      expect(limit1Percent).toBeGreaterThan(1000)
      expect(limit10Percent).toBeGreaterThan(limit1Percent)
    })

    it('should provide capacity statistics', () => {
      const stats = generator.getCapacityStats()

      expect(stats.aliasLength).toBe(8)
      expect(stats.keyspaceSize).toBe(32 ** 8)
      expect(stats.recommendedLimit).toBeGreaterThan(0)
      expect(stats.collision1Percent).toBe(stats.recommendedLimit)
      expect(stats.collision10Percent).toBeGreaterThan(stats.collision1Percent)
    })
  })

  describe('different alias lengths collision analysis', () => {
    it('should show better collision resistance for longer aliases', () => {
      const gen6 = new TailBasedAliasGenerator(6)
      const gen8 = new TailBasedAliasGenerator(8)
      const gen10 = new TailBasedAliasGenerator(10)

      const testTickets = 10000

      const prob6 = gen6.calculateCollisionProbability(testTickets)
      const prob8 = gen8.calculateCollisionProbability(testTickets)
      const prob10 = gen10.calculateCollisionProbability(testTickets)

      expect(prob6).toBeGreaterThan(prob8)
      expect(prob8).toBeGreaterThan(prob10)
    })

    it('should provide different recommended limits', () => {
      const gen6 = new TailBasedAliasGenerator(6)
      const gen10 = new TailBasedAliasGenerator(10)

      const limit6 = gen6.getRecommendedTicketLimit()
      const limit10 = gen10.getRecommendedTicketLimit()

      expect(limit10).toBeGreaterThan(limit6)
    })
  })

  describe('edge cases', () => {
    it('should handle minimum length aliases', () => {
      const generator = new TailBasedAliasGenerator(4)
      const ticketId = TicketId.create(validUlid)

      const alias = generator.generate(ticketId)
      expect(alias.length).toBe(4)
      expect(generator.validate(alias)).toBe(true)
    })

    it('should handle maximum length aliases', () => {
      const generator = new TailBasedAliasGenerator(16)
      const ticketId = TicketId.create(validUlid)

      const alias = generator.generate(ticketId)
      expect(alias.length).toBe(16)
      expect(generator.validate(alias)).toBe(true)
    })
  })
})
