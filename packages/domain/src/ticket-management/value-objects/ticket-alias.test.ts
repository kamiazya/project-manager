import { ValidationError } from '@project-manager/base'
import { describe, expect, it } from 'vitest'
import { TicketAlias } from './ticket-alias.ts'

describe('TicketAlias', () => {
  describe('create', () => {
    it('should create a valid custom alias', () => {
      const alias = TicketAlias.create('feature-auth')
      expect(alias.value).toBe('feature-auth')
      expect(alias.type).toBe('custom')
      expect(alias.isCustom()).toBe(true)
      expect(alias.isCanonical()).toBe(false)
    })

    it('should create a valid canonical alias', () => {
      const alias = TicketAlias.create('b8a0v0a8', 'canonical')
      expect(alias.value).toBe('b8a0v0a8')
      expect(alias.type).toBe('canonical')
      expect(alias.isCanonical()).toBe(true)
      expect(alias.isCustom()).toBe(false)
    })

    it('should normalize alias to lowercase', () => {
      const alias = TicketAlias.create('Feature-AUTH')
      expect(alias.value).toBe('feature-auth')
    })

    it('should trim whitespace', () => {
      const alias = TicketAlias.create('  feature-auth  ')
      expect(alias.value).toBe('feature-auth')
    })

    it('should accept minimum length alias', () => {
      const alias = TicketAlias.create('abc')
      expect(alias.value).toBe('abc')
    })

    it('should accept maximum length alias', () => {
      const longAlias = 'a'.repeat(48) + 'bc' // 50 characters
      const alias = TicketAlias.create(longAlias)
      expect(alias.value).toBe(longAlias)
    })

    it('should accept alias with numbers', () => {
      const alias = TicketAlias.create('feature-123')
      expect(alias.value).toBe('feature-123')
    })

    it('should accept alias starting with number', () => {
      const alias = TicketAlias.create('123-feature')
      expect(alias.value).toBe('123-feature')
    })

    describe('validation errors', () => {
      it('should throw error for alias shorter than minimum', () => {
        expect(() => TicketAlias.create('ab')).toThrow(ValidationError)
        expect(() => TicketAlias.create('ab')).toThrow('at least 3 characters')
      })

      it('should throw error for alias longer than maximum', () => {
        const tooLong = 'a'.repeat(51)
        expect(() => TicketAlias.create(tooLong)).toThrow(ValidationError)
        expect(() => TicketAlias.create(tooLong)).toThrow('cannot exceed 50 characters')
      })

      it('should throw error for empty alias', () => {
        expect(() => TicketAlias.create('')).toThrow(ValidationError)
        expect(() => TicketAlias.create('   ')).toThrow(ValidationError)
      })

      it('should throw error for alias with special characters', () => {
        expect(() => TicketAlias.create('feature@auth')).toThrow(ValidationError)
        expect(() => TicketAlias.create('feature_auth')).toThrow(ValidationError)
        expect(() => TicketAlias.create('feature.auth')).toThrow(ValidationError)
        expect(() => TicketAlias.create('feature/auth')).toThrow(ValidationError)
      })

      it('should throw error for alias starting with hyphen', () => {
        expect(() => TicketAlias.create('-feature')).toThrow(ValidationError)
        expect(() => TicketAlias.create('-feature')).toThrow(
          'must start and end with an alphanumeric'
        )
      })

      it('should throw error for alias ending with hyphen', () => {
        expect(() => TicketAlias.create('feature-')).toThrow(ValidationError)
        expect(() => TicketAlias.create('feature-')).toThrow(
          'must start and end with an alphanumeric'
        )
      })

      it('should throw error for consecutive hyphens', () => {
        expect(() => TicketAlias.create('feature--auth')).toThrow(ValidationError)
        expect(() => TicketAlias.create('feature--auth')).toThrow(
          'cannot contain consecutive hyphens'
        )
      })

      it('should throw error for reserved words', () => {
        expect(() => TicketAlias.create('all')).toThrow(ValidationError)
        expect(() => TicketAlias.create('ALL')).toThrow('reserved')
        expect(() => TicketAlias.create('new')).toThrow('reserved')
        expect(() => TicketAlias.create('create')).toThrow('reserved')
        expect(() => TicketAlias.create('list')).toThrow('reserved')
        expect(() => TicketAlias.create('help')).toThrow('reserved')
      })

      it('should throw error for full ULID pattern', () => {
        const ulid = '01H8XGJWBWBAQ1J3T3B8A0V0A8'
        expect(() => TicketAlias.create(ulid)).toThrow(ValidationError)
        expect(() => TicketAlias.create(ulid)).toThrow('reserved')
      })
    })
  })

  describe('createCanonical', () => {
    it('should create canonical alias without validation', () => {
      // This would normally fail validation as too short, but canonical creation bypasses it
      const alias = TicketAlias.createCanonical('ab')
      expect(alias.value).toBe('ab')
      expect(alias.type).toBe('canonical')
    })

    it('should normalize to lowercase', () => {
      const alias = TicketAlias.createCanonical('B8A0V0A8')
      expect(alias.value).toBe('b8a0v0a8')
    })
  })

  describe('fromValue', () => {
    it('should reconstitute custom alias from storage', () => {
      const alias = TicketAlias.fromValue('feature-auth')
      expect(alias.value).toBe('feature-auth')
      expect(alias.type).toBe('custom')
    })

    it('should reconstitute canonical alias from storage', () => {
      const alias = TicketAlias.fromValue('b8a0v0a8', 'canonical')
      expect(alias.value).toBe('b8a0v0a8')
      expect(alias.type).toBe('canonical')
    })
  })

  describe('matches', () => {
    it('should match case-insensitively', () => {
      const alias = TicketAlias.create('feature-auth')
      expect(alias.matches('feature-auth')).toBe(true)
      expect(alias.matches('Feature-Auth')).toBe(true)
      expect(alias.matches('FEATURE-AUTH')).toBe(true)
    })

    it('should not match different aliases', () => {
      const alias = TicketAlias.create('feature-auth')
      expect(alias.matches('feature-login')).toBe(false)
      expect(alias.matches('feature')).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the alias value', () => {
      const alias = TicketAlias.create('feature-auth')
      expect(alias.toString()).toBe('feature-auth')
    })
  })

  describe('equals', () => {
    it('should compare aliases by value and type', () => {
      const alias1 = TicketAlias.create('feature-auth', 'custom')
      const alias2 = TicketAlias.create('feature-auth', 'custom')
      const alias3 = TicketAlias.create('feature-auth', 'canonical')
      const alias4 = TicketAlias.create('feature-login', 'custom')

      expect(alias1.equals(alias2)).toBe(true)
      expect(alias1.equals(alias3)).toBe(false) // Different type
      expect(alias1.equals(alias4)).toBe(false) // Different value
    })

    it('should handle case differences', () => {
      const alias1 = TicketAlias.create('Feature-Auth')
      const alias2 = TicketAlias.create('feature-auth')
      expect(alias1.equals(alias2)).toBe(true)
    })
  })
})
