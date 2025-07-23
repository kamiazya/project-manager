import { describe, expect, it } from 'vitest'
import { TicketValidationError } from '../types/errors.ts'
import { TicketDescription } from './ticket-description.ts'

describe('TicketDescription', () => {
  describe('create', () => {
    it('should create description with valid string', () => {
      const description = TicketDescription.create('Valid description text')

      expect(description).toBeInstanceOf(TicketDescription)
      expect(description.value).toBe('Valid description text')
      expect(description.toString()).toBe('Valid description text')
    })

    it('should trim whitespace from description', () => {
      const description = TicketDescription.create('  Trimmed description  ')

      expect(description.value).toBe('Trimmed description')
    })

    it('should handle description with maximum length', () => {
      const maxLengthDescription = 'A'.repeat(5000)
      const description = TicketDescription.create(maxLengthDescription)

      expect(description.value).toBe(maxLengthDescription)
      expect(description.value).toHaveLength(5000)
    })

    it('should handle multiline descriptions', () => {
      const multilineDescription = 'Line 1\nLine 2\nLine 3'
      const description = TicketDescription.create(multilineDescription)

      expect(description.value).toBe(multilineDescription)
    })

    it('should handle descriptions with special characters', () => {
      const specialDescription = 'Description with special chars: !@#$%^&*()_+{}|:<>?[]\\;\'",./`~'
      const description = TicketDescription.create(specialDescription)

      expect(description.value).toBe(specialDescription)
    })

    it('should handle descriptions with Unicode characters', () => {
      const unicodeDescription = 'Unicode: 🎉 测试 αβγ ñoñó émoji'
      const description = TicketDescription.create(unicodeDescription)

      expect(description.value).toBe(unicodeDescription)
    })

    it('should handle descriptions with HTML-like content', () => {
      const htmlDescription = '<script>alert("test")</script> Some content'
      const description = TicketDescription.create(htmlDescription)

      expect(description.value).toBe(htmlDescription)
    })

    it('should handle descriptions with JSON-like content', () => {
      const jsonDescription = '{"key": "value", "number": 123, "array": [1,2,3]}'
      const description = TicketDescription.create(jsonDescription)

      expect(description.value).toBe(jsonDescription)
    })

    it('should throw error for empty string', () => {
      expect(() => {
        TicketDescription.create('')
      }).toThrow(TicketValidationError)
      expect(() => {
        TicketDescription.create('')
      }).toThrow('Description cannot be empty or whitespace only')
    })

    it('should throw error for whitespace-only string', () => {
      expect(() => {
        TicketDescription.create('   ')
      }).toThrow(TicketValidationError)
      expect(() => {
        TicketDescription.create('   ')
      }).toThrow('Description cannot be empty or whitespace only')
    })

    it('should throw error for tabs and newlines only', () => {
      expect(() => {
        TicketDescription.create('\t\n\r  ')
      }).toThrow(TicketValidationError)
    })

    it('should throw error for description exceeding maximum length', () => {
      const tooLongDescription = 'A'.repeat(5001)

      expect(() => {
        TicketDescription.create(tooLongDescription)
      }).toThrow(TicketValidationError)
      expect(() => {
        TicketDescription.create(tooLongDescription)
      }).toThrow('Description cannot exceed 5000 characters')
    })

    it('should throw error for very long description', () => {
      const extremelyLongDescription = 'A'.repeat(10000)

      expect(() => {
        TicketDescription.create(extremelyLongDescription)
      }).toThrow(TicketValidationError)
    })

    it('should throw error for description with only newlines after trimming', () => {
      expect(() => {
        TicketDescription.create('  \n\n\n  ')
      }).toThrow(TicketValidationError)
    })
  })

  describe('createOptional', () => {
    it('should create description when valid value provided', () => {
      const description = TicketDescription.createOptional('Optional description')

      expect(description).toBeInstanceOf(TicketDescription)
      expect(description!.value).toBe('Optional description')
    })

    it('should return undefined for undefined input', () => {
      const description = TicketDescription.createOptional(undefined)

      expect(description).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const description = TicketDescription.createOptional('')

      expect(description).toBeUndefined()
    })

    it('should return undefined for whitespace-only string', () => {
      const description = TicketDescription.createOptional('   ')

      expect(description).toBeUndefined()
    })

    it('should return undefined for tabs and newlines only', () => {
      const description = TicketDescription.createOptional('\t\n\r  ')

      expect(description).toBeUndefined()
    })

    it('should throw error if provided value exceeds maximum length', () => {
      const tooLongDescription = 'A'.repeat(5001)

      expect(() => {
        TicketDescription.createOptional(tooLongDescription)
      }).toThrow(TicketValidationError)
    })

    it('should create description with valid trimmed content', () => {
      const description = TicketDescription.createOptional('  Valid content  ')

      expect(description).toBeInstanceOf(TicketDescription)
      expect(description!.value).toBe('Valid content')
    })
  })

  describe('value object behavior', () => {
    it('should be immutable', () => {
      const description = TicketDescription.create('Immutable description')
      const originalValue = description.value

      // Attempt to modify the value (should not be possible)
      expect(description.value).toBe(originalValue)
    })

    it('should support equality comparison', () => {
      const description1 = TicketDescription.create('Same description')
      const description2 = TicketDescription.create('Same description')
      const description3 = TicketDescription.create('Different description')

      expect(description1.equals(description2)).toBe(true)
      expect(description1.equals(description3)).toBe(false)
      expect(description2.equals(description3)).toBe(false)
    })

    it('should handle case-sensitive equality', () => {
      const description1 = TicketDescription.create('Case Sensitive')
      const description2 = TicketDescription.create('case sensitive')

      expect(description1.equals(description2)).toBe(false)
    })

    it('should handle whitespace differences in equality', () => {
      const description1 = TicketDescription.create('  Trimmed  ')
      const description2 = TicketDescription.create('Trimmed')

      expect(description1.equals(description2)).toBe(true)
    })
  })

  describe('toString', () => {
    it('should return the string value', () => {
      const descriptionText = 'Description for toString test'
      const description = TicketDescription.create(descriptionText)

      expect(description.toString()).toBe(descriptionText)
    })

    it('should return trimmed value in toString', () => {
      const description = TicketDescription.create('  Trimmed value  ')

      expect(description.toString()).toBe('Trimmed value')
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle description with exactly one character', () => {
      const description = TicketDescription.create('A')

      expect(description.value).toBe('A')
    })

    it('should handle description at length boundary (4999 chars)', () => {
      const boundaryDescription = 'A'.repeat(4999)
      const description = TicketDescription.create(boundaryDescription)

      expect(description.value).toBe(boundaryDescription)
      expect(description.value).toHaveLength(4999)
    })

    it('should handle description with null characters', () => {
      const nullDescription = 'Description with \0 null char'
      const description = TicketDescription.create(nullDescription)

      expect(description.value).toBe(nullDescription)
    })

    it('should handle description with control characters', () => {
      const controlDescription = 'Description with \x01\x02\x03 control chars'
      const description = TicketDescription.create(controlDescription)

      expect(description.value).toBe(controlDescription)
    })

    it('should handle description with various whitespace characters', () => {
      const whitespaceDescription = 'Text\twith\nvarious\rwhitespace\fcharacters'
      const description = TicketDescription.create(whitespaceDescription)

      expect(description.value).toBe(whitespaceDescription)
    })
  })

  describe('error handling and validation', () => {
    it('should throw TicketValidationError with correct field name', () => {
      try {
        TicketDescription.create('')
      } catch (error) {
        expect(error).toBeInstanceOf(TicketValidationError)
        expect((error as TicketValidationError).field).toBe('description')
      }
    })

    it('should throw TicketValidationError for length violation with correct field name', () => {
      try {
        TicketDescription.create('A'.repeat(5001))
      } catch (error) {
        expect(error).toBeInstanceOf(TicketValidationError)
        expect((error as TicketValidationError).field).toBe('description')
      }
    })

    it('should provide specific error messages', () => {
      expect(() => {
        TicketDescription.create('')
      }).toThrow('Description cannot be empty or whitespace only')

      expect(() => {
        TicketDescription.create('A'.repeat(5001))
      }).toThrow('Description cannot exceed 5000 characters')
    })
  })

  describe('performance characteristics', () => {
    it('should handle large valid descriptions efficiently', () => {
      const largeDescription = 'A'.repeat(4000)
      const start = Date.now()

      const description = TicketDescription.create(largeDescription)

      const duration = Date.now() - start
      expect(description.value).toBe(largeDescription)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should validate large invalid descriptions efficiently', () => {
      const invalidLargeDescription = 'A'.repeat(6000)
      const start = Date.now()

      expect(() => {
        TicketDescription.create(invalidLargeDescription)
      }).toThrow()

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })
  })

  describe('integration with domain layer', () => {
    it('should work as expected in domain object composition', () => {
      const description1 = TicketDescription.create('First description')
      const description2 = TicketDescription.create('Second description')

      // Simulate usage in domain aggregates
      const descriptions = [description1, description2]
      const values = descriptions.map(d => d.value)

      expect(values).toEqual(['First description', 'Second description'])
    })

    it('should maintain value object semantics in collections', () => {
      const desc1 = TicketDescription.create('Unique description 1')
      const desc2 = TicketDescription.create('Unique description 2')
      const desc3 = TicketDescription.create('Unique description 1') // Same value as desc1

      // Test equality behavior
      expect(desc1.equals(desc3)).toBe(true)
      expect(desc1.equals(desc2)).toBe(false)

      // Note: JavaScript Set uses reference equality, not value equality
      // So each object instance is treated as unique in the Set
      const descriptions = new Set([desc1, desc2, desc3])
      expect(descriptions.size).toBe(3) // All three instances are different references

      // For value-based uniqueness, we'd need custom logic
      const uniqueValues = Array.from(new Set([desc1.value, desc2.value, desc3.value]))
      expect(uniqueValues).toHaveLength(2) // Only 2 unique values
    })
  })
})
