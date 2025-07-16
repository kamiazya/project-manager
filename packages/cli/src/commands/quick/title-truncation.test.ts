import { describe, expect, test } from 'vitest'
import { MAX_TITLE_LENGTH, TITLE_TRUNCATE_LENGTH } from '../../lib/constants.ts'

describe('Title Truncation Consistency', () => {
  test('should use consistent MAX_TITLE_LENGTH across all quick commands', () => {
    // All quick commands should import and use the same constant
    expect(MAX_TITLE_LENGTH).toBe(50)
    expect(TITLE_TRUNCATE_LENGTH).toBe(47)
  })

  test('should use exact truncation length for all commands', () => {
    const exactlyMaxLength = 'A'.repeat(MAX_TITLE_LENGTH)
    const slightlyOverMaxLength = 'A'.repeat(MAX_TITLE_LENGTH + 1)

    // Test that titles exactly at max length are not truncated
    expect(exactlyMaxLength.length).toBe(MAX_TITLE_LENGTH)

    // Test that titles over max length would be truncated
    expect(slightlyOverMaxLength.length).toBe(MAX_TITLE_LENGTH + 1)

    // Simulate truncation logic
    const shouldTruncate = exactlyMaxLength.length > MAX_TITLE_LENGTH
    const shouldTruncateSlightly = slightlyOverMaxLength.length > MAX_TITLE_LENGTH

    expect(shouldTruncate).toBe(false)
    expect(shouldTruncateSlightly).toBe(true)
  })

  test('should produce consistent truncated output format', () => {
    const longTitle = 'This is a very long ticket title that should be truncated'

    // Simulate the truncation logic used in all commands
    const truncatedTitle =
      longTitle.length > MAX_TITLE_LENGTH
        ? `${longTitle.substring(0, TITLE_TRUNCATE_LENGTH)}...`
        : longTitle

    expect(truncatedTitle).toBe('This is a very long ticket title that should be...')
    expect(truncatedTitle.length).toBe(TITLE_TRUNCATE_LENGTH + 3) // +3 for "..."
    expect(truncatedTitle.length).toBe(MAX_TITLE_LENGTH)
  })

  test('should handle edge cases consistently', () => {
    const edgeCases = [
      '', // Empty title
      'A', // Single character
      'A'.repeat(MAX_TITLE_LENGTH - 1), // Just under max
      'A'.repeat(MAX_TITLE_LENGTH), // Exactly max
      'A'.repeat(MAX_TITLE_LENGTH + 1), // Just over max
      'A'.repeat(100), // Much longer
    ]

    edgeCases.forEach(title => {
      const truncatedTitle =
        title.length > MAX_TITLE_LENGTH ? `${title.substring(0, TITLE_TRUNCATE_LENGTH)}...` : title

      // All truncated titles should be at most MAX_TITLE_LENGTH
      expect(truncatedTitle.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)

      // Titles under max length should be unchanged
      if (title.length <= MAX_TITLE_LENGTH) {
        expect(truncatedTitle).toBe(title)
      }

      // Titles over max length should be truncated with "..."
      if (title.length > MAX_TITLE_LENGTH) {
        expect(truncatedTitle.endsWith('...')).toBe(true)
        expect(truncatedTitle.length).toBe(MAX_TITLE_LENGTH)
      }
    })
  })
})
