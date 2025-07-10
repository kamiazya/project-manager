import { describe, expect, it } from 'vitest'
import {
  isTicketError,
  StorageError,
  TicketError,
  TicketNotFoundError,
  TicketValidationError,
} from './errors.js'

describe('Custom Error Types', () => {
  describe('TicketError', () => {
    it('should create a base ticket error', () => {
      const error = new TicketError('Test error message')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(TicketError)
      expect(error.message).toBe('Test error message')
      expect(error.name).toBe('TicketError')
    })

    it('should include error code when provided', () => {
      const error = new TicketError('Test message', 'TEST_ERROR')

      expect(error.code).toBe('TEST_ERROR')
    })
  })

  describe('TicketNotFoundError', () => {
    it('should create a ticket not found error', () => {
      const error = new TicketNotFoundError('12345678')

      expect(error).toBeInstanceOf(TicketError)
      expect(error).toBeInstanceOf(TicketNotFoundError)
      expect(error.message).toBe('Ticket not found: 12345678')
      expect(error.name).toBe('TicketNotFoundError')
      expect(error.code).toBe('TICKET_NOT_FOUND')
      expect(error.ticketId).toBe('12345678')
    })
  })

  describe('TicketValidationError', () => {
    it('should create a validation error', () => {
      const error = new TicketValidationError('Title is required')

      expect(error).toBeInstanceOf(TicketError)
      expect(error).toBeInstanceOf(TicketValidationError)
      expect(error.message).toBe('Title is required')
      expect(error.name).toBe('TicketValidationError')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should include field name when provided', () => {
      const error = new TicketValidationError('Title is required', 'title')

      expect(error.field).toBe('title')
    })
  })

  describe('StorageError', () => {
    it('should create a storage error', () => {
      const error = new StorageError('Failed to write file')

      expect(error).toBeInstanceOf(TicketError)
      expect(error).toBeInstanceOf(StorageError)
      expect(error.message).toBe('Failed to write file')
      expect(error.name).toBe('StorageError')
      expect(error.code).toBe('STORAGE_ERROR')
    })

    it('should include original error when provided', () => {
      const originalError = new Error('File system error')
      const error = new StorageError('Failed to write file', originalError)

      expect(error.originalError).toBe(originalError)
    })
  })

  describe('isTicketError', () => {
    it('should return true for ticket errors', () => {
      const ticketError = new TicketError('Test')
      const notFoundError = new TicketNotFoundError('123')
      const validationError = new TicketValidationError('Invalid')
      const storageError = new StorageError('Storage failed')

      expect(isTicketError(ticketError)).toBe(true)
      expect(isTicketError(notFoundError)).toBe(true)
      expect(isTicketError(validationError)).toBe(true)
      expect(isTicketError(storageError)).toBe(true)
    })

    it('should return false for regular errors', () => {
      const regularError = new Error('Regular error')
      const typeError = new TypeError('Type error')

      expect(isTicketError(regularError)).toBe(false)
      expect(isTicketError(typeError)).toBe(false)
      expect(isTicketError(null)).toBe(false)
      expect(isTicketError(undefined)).toBe(false)
      expect(isTicketError('string')).toBe(false)
    })
  })
})
