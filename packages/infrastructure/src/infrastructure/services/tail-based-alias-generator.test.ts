import { TicketId } from '@project-manager/domain'
import { describe, expect, it } from 'vitest'
import { TailBasedAliasGenerator } from './tail-based-alias-generator.ts'

describe('TailBasedAliasGenerator', () => {
  const validUlid = '01H8XGJWBWBAQ1J3T3B8A0V0A8'

  describe('constructor', () => {
    it('should create generator with default length', () => {
      const generator = new TailBasedAliasGenerator()
      expect(generator).toBeDefined()
    })

    it('should create generator with custom length', () => {
      const generator = new TailBasedAliasGenerator(10)
      expect(generator).toBeDefined()
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

  describe('edge cases', () => {
    it('should handle minimum length aliases', () => {
      const generator = new TailBasedAliasGenerator(4)
      const ticketId = TicketId.create(validUlid)

      const alias = generator.generate(ticketId)
      expect(alias.length).toBe(4)
    })

    it('should handle maximum length aliases', () => {
      const generator = new TailBasedAliasGenerator(16)
      const ticketId = TicketId.create(validUlid)

      const alias = generator.generate(ticketId)
      expect(alias.length).toBe(16)
    })
  })
})
