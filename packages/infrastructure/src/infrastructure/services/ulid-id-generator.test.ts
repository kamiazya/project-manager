import { IdGenerationError } from '@project-manager/application'
import { ulid } from 'ulid'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UlidIdGenerator } from './ulid-id-generator.ts'

// Mock the ulid library for error testing
vi.mock('ulid', () => ({
  ulid: vi.fn(),
}))

const mockedUlid = vi.mocked(ulid)

describe('UlidIdGenerator', () => {
  let generator: UlidIdGenerator

  beforeEach(() => {
    generator = new UlidIdGenerator()
    vi.clearAllMocks()
  })

  describe('generateId', () => {
    it('should generate a valid 26-character ULID', () => {
      const mockUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV'
      mockedUlid.mockReturnValue(mockUlid)

      const id = generator.generateId()

      expect(id).toBe(mockUlid)
      expect(id).toHaveLength(26)
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/) // Base32 character set
      expect(mockedUlid).toHaveBeenCalledWith()
    })

    it('should generate different ULIDs on multiple calls', () => {
      const mockUlids = [
        '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        '01ARZ3NDEKTSV4RRFFQ69G5FBW',
        '01ARZ3NDEKTSV4RRFFQ69G5FCX',
      ]
      mockedUlid
        .mockReturnValueOnce(mockUlids[0]!)
        .mockReturnValueOnce(mockUlids[1]!)
        .mockReturnValueOnce(mockUlids[2]!)

      const ids = [generator.generateId(), generator.generateId(), generator.generateId()]

      expect(new Set(ids).size).toBe(3)
      expect(ids).toEqual(mockUlids)
      expect(mockedUlid).toHaveBeenCalledTimes(3)
    })

    it('should throw IdGenerationError when ulid generation fails', () => {
      const mockError = new Error('ULID generation failed')
      mockedUlid.mockImplementation(() => {
        throw mockError
      })

      expect(() => generator.generateId()).toThrow(IdGenerationError)
      expect(() => generator.generateId()).toThrow('Failed to generate ULID')

      try {
        generator.generateId()
      } catch (error) {
        expect(error).toBeInstanceOf(IdGenerationError)
        expect((error as IdGenerationError).cause).toBe(mockError)
      }
    })
  })

  describe('generateIdWithTimestamp', () => {
    it('should generate a ULID with specific timestamp', () => {
      const mockUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV'
      const timestamp = 1609459200000 // 2021-01-01T00:00:00.000Z
      mockedUlid.mockReturnValue(mockUlid)

      const id = generator.generateIdWithTimestamp(timestamp)

      expect(id).toBe(mockUlid)
      expect(mockedUlid).toHaveBeenCalledWith(timestamp)
    })

    it('should throw IdGenerationError with timestamp context when generation fails', () => {
      const mockError = new Error('ULID with timestamp generation failed')
      const timestamp = 1609459200000
      mockedUlid.mockImplementation(() => {
        throw mockError
      })

      expect(() => generator.generateIdWithTimestamp(timestamp)).toThrow(IdGenerationError)
      expect(() => generator.generateIdWithTimestamp(timestamp)).toThrow(
        `Failed to generate ULID with timestamp ${timestamp}`
      )

      try {
        generator.generateIdWithTimestamp(timestamp)
      } catch (error) {
        expect(error).toBeInstanceOf(IdGenerationError)
        expect((error as IdGenerationError).cause).toBe(mockError)
        expect((error as IdGenerationError).context).toEqual({ timestamp })
      }
    })
  })

  describe('ULID properties validation (mocked)', () => {
    it('should generate lexicographically sortable IDs', () => {
      const earlierTimestamp = 1609459200000 // 2021-01-01T00:00:00.000Z
      const laterTimestamp = 1609459260000 // 2021-01-01T00:01:00.000Z

      mockedUlid
        .mockReturnValueOnce('01ARZ3NDEKTSV4RRFFQ69G5FAV') // Earlier timestamp
        .mockReturnValueOnce('01ARZ3SDEKTSV4RRFFQ69G5FAV') // Later timestamp

      const earlierId = generator.generateIdWithTimestamp(earlierTimestamp)
      const laterId = generator.generateIdWithTimestamp(laterTimestamp)

      // Lexicographically sortable property
      expect(earlierId < laterId).toBe(true)
    })

    it('should generate IDs with correct Base32 character set', () => {
      const mockUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV'
      mockedUlid.mockReturnValue(mockUlid)

      const id = generator.generateId()

      // ULID uses Crockford Base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
      // Excludes: I, L, O, U to avoid ambiguity
      const base32Pattern = /^[0-9A-HJKMNP-TV-Z]{26}$/
      expect(id).toMatch(base32Pattern)
      expect(id).not.toMatch(/[ILOU]/) // Should not contain ambiguous characters
    })
  })
})

// Real ULID validation tests - using actual ulid library without mocks
describe('UlidIdGenerator - Real ULID validation', () => {
  let generator: UlidIdGenerator

  beforeEach(async () => {
    // Unmock the ulid library for real tests
    vi.clearAllMocks()

    // Import real ulid function and restore it
    const realUlid = await vi.importActual<typeof import('ulid')>('ulid')
    mockedUlid.mockImplementation(realUlid.ulid)

    generator = new UlidIdGenerator()
  })

  describe('real ULID properties validation', () => {
    it('should generate real ULIDs with correct format and properties', () => {
      const id1 = generator.generateId()
      const id2 = generator.generateId()

      // Basic format validation
      expect(id1).toHaveLength(26)
      expect(id2).toHaveLength(26)
      expect(id1).not.toBe(id2) // Should be unique

      // ULID uses Crockford Base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
      const base32Pattern = /^[0-9A-HJKMNP-TV-Z]{26}$/
      expect(id1).toMatch(base32Pattern)
      expect(id2).toMatch(base32Pattern)

      // Should not contain ambiguous characters (I, L, O, U)
      expect(id1).not.toMatch(/[ILOU]/)
      expect(id2).not.toMatch(/[ILOU]/)
    })

    it('should generate lexicographically sortable IDs with real timestamps', () => {
      const earlierTimestamp = Date.now()
      // Wait 1ms to ensure different timestamp
      const laterTimestamp = earlierTimestamp + 1

      const earlierId = generator.generateIdWithTimestamp(earlierTimestamp)
      const laterId = generator.generateIdWithTimestamp(laterTimestamp)

      // Real lexicographical sorting validation
      expect(earlierId < laterId).toBe(true)
      expect([laterId, earlierId].sort()).toEqual([earlierId, laterId])
    })

    it('should generate unique IDs with same timestamp', () => {
      const timestamp = Date.now()
      const ids = []

      // Generate multiple IDs with same timestamp
      for (let i = 0; i < 5; i++) {
        ids.push(generator.generateIdWithTimestamp(timestamp))
      }

      // All should be unique despite same timestamp (due to randomness in entropy portion)
      expect(new Set(ids).size).toBe(ids.length)

      // All should have same timestamp prefix (first 10 characters)
      const timestampPortion = ids[0]!.substring(0, 10)
      for (const id of ids) {
        expect(id.substring(0, 10)).toBe(timestampPortion)
      }

      // Note: ULIDs don't guarantee monotonic ordering within same millisecond
      // They use random entropy, so ordering depends on randomness
      for (const id of ids) {
        expect(id).toHaveLength(26)
        expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
      }
    })

    it('should handle timestamp encoding correctly in real ULIDs', () => {
      const knownTimestamp = 1609459200000 // 2021-01-01T00:00:00.000Z
      const id = generator.generateIdWithTimestamp(knownTimestamp)

      // Extract timestamp portion (first 10 characters)
      const timestampPortion = id.substring(0, 10)

      // Should be valid Base32
      expect(timestampPortion).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/)

      // Should not contain ambiguous characters
      expect(timestampPortion).not.toMatch(/[ILOU]/)
    })

    it('should generate unique IDs even with rapid generation', () => {
      const ids = new Set()
      const count = 100

      // Generate many IDs rapidly
      for (let i = 0; i < count; i++) {
        ids.add(generator.generateId())
      }

      // All should be unique
      expect(ids.size).toBe(count)

      // All should be valid ULIDs
      for (const id of ids) {
        expect(typeof id).toBe('string')
        expect(id).toHaveLength(26)
        expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
      }
    })

    it('should handle edge case timestamps correctly', () => {
      const edgeCases = [
        0, // Unix epoch
        1, // Minimal positive timestamp
        Date.now(), // Current time
        2147483647000, // Year 2038 problem boundary
        281474976710655, // Maximum 48-bit timestamp (ULID limit)
      ]

      for (const timestamp of edgeCases) {
        const id = generator.generateIdWithTimestamp(timestamp)

        expect(id).toHaveLength(26)
        expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
        expect(id).not.toMatch(/[ILOU]/)
      }
    })
  })
})
