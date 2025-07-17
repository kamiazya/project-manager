// Test constants (previously from shared package)
const VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  TITLE_DISPLAY_MAX_LENGTH: 40,
}

import { describe, expect, it } from 'vitest'
import { TicketTitle } from './ticket-title.ts'

describe('TicketTitle', () => {
  describe('create', () => {
    it('should create a TicketTitle with valid title', () => {
      const title = 'Fix login bug'
      const ticketTitle = TicketTitle.create(title)

      expect(ticketTitle.value).toBe(title)
    })

    it('should trim whitespace from title', () => {
      const title = '  Fix login bug  '
      const ticketTitle = TicketTitle.create(title)

      expect(ticketTitle.value).toBe('Fix login bug')
    })

    it('should throw error when title is empty', () => {
      expect(() => TicketTitle.create('')).toThrow('Title cannot be empty or whitespace only')
    })

    it('should throw error when title is only whitespace', () => {
      expect(() => TicketTitle.create('   ')).toThrow('Title cannot be empty or whitespace only')
    })

    it('should throw error when title exceeds max length', () => {
      const longTitle = 'a'.repeat(VALIDATION.TITLE_MAX_LENGTH + 1)

      expect(() => TicketTitle.create(longTitle)).toThrow(
        `Title cannot exceed ${VALIDATION.TITLE_MAX_LENGTH} characters`
      )
    })

    it('should accept title at max length', () => {
      const maxTitle = 'a'.repeat(VALIDATION.TITLE_MAX_LENGTH)
      const ticketTitle = TicketTitle.create(maxTitle)

      expect(ticketTitle.value).toBe(maxTitle)
    })
  })

  describe('toDisplay', () => {
    it('should return full title when shorter than display length', () => {
      const title = 'Short title'
      const ticketTitle = TicketTitle.create(title)

      expect(ticketTitle.toDisplay()).toBe(title)
    })

    it('should truncate long title with ellipsis', () => {
      const longTitle = 'This is a very long title that needs to be truncated for display purposes'
      const ticketTitle = TicketTitle.create(longTitle)

      const displayed = ticketTitle.toDisplay()
      expect(displayed).toHaveLength(VALIDATION.TITLE_DISPLAY_MAX_LENGTH)
      expect(displayed.endsWith('...')).toBe(true)
      expect(displayed).toBe(
        `${longTitle.substring(0, VALIDATION.TITLE_DISPLAY_MAX_LENGTH - 3)}...`
      )
    })

    it('should use custom max length when provided', () => {
      const title = 'Custom length test'
      const ticketTitle = TicketTitle.create(title)
      const customLength = 10

      const displayed = ticketTitle.toDisplay(customLength)
      expect(displayed).toBe('Custom ...')
      expect(displayed).toHaveLength(customLength)
    })

    it('should return empty string when maxLength is 0', () => {
      const title = 'Any title'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(0)
      expect(displayed).toBe('')
      expect(displayed).toHaveLength(0)
    })

    it('should return single character when maxLength is 1', () => {
      const title = 'Long title'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(1)
      expect(displayed).toBe('L')
      expect(displayed).toHaveLength(1)
    })

    it('should return two characters when maxLength is 2', () => {
      const title = 'Long title'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(2)
      expect(displayed).toBe('Lo')
      expect(displayed).toHaveLength(2)
    })

    it('should return three characters when maxLength is 3', () => {
      const title = 'Long title'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(3)
      expect(displayed).toBe('Lon')
      expect(displayed).toHaveLength(3)
    })

    it('should handle maxLength exactly equal to title length', () => {
      const title = 'Exact'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(5)
      expect(displayed).toBe('Exact')
      expect(displayed).toHaveLength(5)
    })

    it('should handle negative maxLength', () => {
      const title = 'Any title'
      const ticketTitle = TicketTitle.create(title)

      const displayed = ticketTitle.toDisplay(-1)
      expect(displayed).toBe('')
      expect(displayed).toHaveLength(0)
    })
  })

  describe('equals', () => {
    it('should return true for equal titles', () => {
      const title = 'Same title'
      const ticketTitle1 = TicketTitle.create(title)
      const ticketTitle2 = TicketTitle.create(title)

      expect(ticketTitle1.equals(ticketTitle2)).toBe(true)
    })

    it('should return false for different titles', () => {
      const ticketTitle1 = TicketTitle.create('Title 1')
      const ticketTitle2 = TicketTitle.create('Title 2')

      expect(ticketTitle1.equals(ticketTitle2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the title value as string', () => {
      const title = 'Test title'
      const ticketTitle = TicketTitle.create(title)

      expect(ticketTitle.toString()).toBe(title)
    })
  })
})
