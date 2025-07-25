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

  describe('ULID properties validation', () => {
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
