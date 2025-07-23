import { describe, expect, it } from 'vitest'
import { TicketId } from '../value-objects/ticket-id.ts'
import type { CreateTicketData, ReconstituteTicketData } from './ticket.ts'
import { Ticket } from './ticket.ts'

describe('Ticket Entity', () => {
  describe('create factory method', () => {
    it('should create a ticket with valid data', () => {
      const ticketId = TicketId.create('a1b2c3d4')
      const data: CreateTicketData = {
        title: 'Fix login bug',
        description: 'Users cannot log in with valid credentials',
        status: 'pending',
        priority: 'high',
        type: 'bug',
      }

      const ticket = Ticket.create(ticketId, data)

      expect(ticket.title.value).toBe(data.title)
      expect(ticket.description?.value).toBe(data.description)
      expect(ticket.status).toBe('pending')
      expect(ticket.priority).toBe('high')
      expect(ticket.type).toBe('bug')
      expect(ticket.createdAt).toBeInstanceOf(Date)
      expect(ticket.updatedAt).toBeInstanceOf(Date)
      expect(ticket.id.value).toBeDefined()
    })

    it('should throw error for invalid status', () => {
      const data: CreateTicketData = {
        title: 'Test ticket',
        description: 'Test description',
        status: 'invalid-status',
        priority: 'medium',
        type: 'task',
      }

      const ticketId = TicketId.create('a1b2c3d4')
      expect(() => Ticket.create(ticketId, data)).toThrow(
        'Invalid ticket status: invalid-status. Must contain only lowercase letters and underscores.'
      )
    })

    it('should throw error for invalid priority', () => {
      const data: CreateTicketData = {
        title: 'Test ticket',
        description: 'Test description',
        status: 'pending',
        priority: 'INVALID',
        type: 'task',
      }

      const ticketId = TicketId.create('a1b2c3d4')
      expect(() => Ticket.create(ticketId, data)).toThrow(
        'Invalid ticket priority: INVALID. Must contain only lowercase letters and underscores.'
      )
    })

    it('should throw error for invalid type', () => {
      const data: CreateTicketData = {
        title: 'Test ticket',
        description: 'Test description',
        status: 'pending',
        priority: 'medium',
        type: '123-invalid',
      }

      const ticketId = TicketId.create('a1b2c3d4')
      expect(() => Ticket.create(ticketId, data)).toThrow(
        'Invalid ticket type: 123-invalid. Must contain only lowercase letters and underscores.'
      )
    })

    it('should throw error for empty status', () => {
      const data: CreateTicketData = {
        title: 'Test ticket',
        description: 'Test description',
        status: '',
        priority: 'medium',
        type: 'task',
      }

      const ticketId = TicketId.create('a1b2c3d4')
      expect(() => Ticket.create(ticketId, data)).toThrow(
        'Invalid ticket status: . Must contain only lowercase letters and underscores.'
      )
    })
  })

  describe('reconstitute factory method', () => {
    it('should reconstitute a ticket from valid persistence data', () => {
      const data: ReconstituteTicketData = {
        id: 'ticket_123456789',
        title: 'Existing ticket',
        description: 'Restored from database',
        status: 'in_progress',
        priority: 'low',
        type: 'feature',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T12:00:00.000Z',
      }

      const ticket = Ticket.reconstitute(data)

      expect(ticket.id.value).toBe(data.id)
      expect(ticket.title.value).toBe(data.title)
      expect(ticket.description?.value).toBe(data.description)
      expect(ticket.status).toBe('in_progress')
      expect(ticket.priority).toBe('low')
      expect(ticket.type).toBe('feature')
      expect(ticket.createdAt).toEqual(new Date(data.createdAt))
      expect(ticket.updatedAt).toEqual(new Date(data.updatedAt))
    })

    it('should throw error for invalid status in persistence data', () => {
      const data: ReconstituteTicketData = {
        id: 'ticket_123456789',
        title: 'Existing ticket',
        description: 'Restored from database',
        status: 'INVALID_STATUS',
        priority: 'low',
        type: 'feature',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T12:00:00.000Z',
      }

      expect(() => Ticket.reconstitute(data)).toThrow(
        'Invalid ticket status: INVALID_STATUS. Must contain only lowercase letters and underscores.'
      )
    })

    it('should throw error for invalid priority in persistence data', () => {
      const data: ReconstituteTicketData = {
        id: 'ticket_123456789',
        title: 'Existing ticket',
        description: 'Restored from database',
        status: 'pending',
        priority: 'super-high!',
        type: 'feature',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T12:00:00.000Z',
      }

      expect(() => Ticket.reconstitute(data)).toThrow(
        'Invalid ticket priority: super-high!. Must contain only lowercase letters and underscores.'
      )
    })

    it('should throw error for invalid type in persistence data', () => {
      const data: ReconstituteTicketData = {
        id: 'ticket_123456789',
        title: 'Existing ticket',
        description: 'Restored from database',
        status: 'pending',
        priority: 'medium',
        type: 'invalid.type',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T12:00:00.000Z',
      }

      expect(() => Ticket.reconstitute(data)).toThrow(
        'Invalid ticket type: invalid.type. Must contain only lowercase letters and underscores.'
      )
    })
  })
})
