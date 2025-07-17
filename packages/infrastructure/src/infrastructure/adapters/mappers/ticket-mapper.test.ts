import { Ticket } from '@project-manager/domain'
import { describe, expect, it } from 'vitest'
import type { TicketJSON } from '../../types/persistence-types.ts'
import * as TicketMapper from './ticket-mapper.ts'

describe('Ticket Mapper Functions', () => {
  const sampleTicketJSON: TicketJSON = {
    id: 'test-ticket-123',
    title: 'Fix login bug',
    description: 'Users cannot login with email',
    status: 'pending',
    priority: 'high',
    type: 'bug',
    privacy: 'local-only',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }

  describe('toPersistence', () => {
    it('should convert domain ticket to persistence format', () => {
      // Create a ticket and then convert it
      const ticket = Ticket.reconstitute({
        id: 'test-ticket-123',
        title: 'Fix login bug',
        description: 'Users cannot login with email',
        status: 'pending',
        priority: 'high',
        type: 'bug',
        privacy: 'local-only',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      })

      const json = TicketMapper.toPersistence(ticket)

      expect(json).toEqual({
        id: 'test-ticket-123',
        title: 'Fix login bug',
        description: 'Users cannot login with email',
        status: 'pending',
        priority: 'high',
        type: 'bug',
        privacy: 'local-only',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      })
    })

    it('should handle different statuses and priorities', () => {
      const ticket = Ticket.create({
        title: 'Feature request',
        description: 'Add new feature',
        priority: 'low',
        status: 'in_progress',
        type: 'feature',
        privacy: 'public',
      })

      const json = TicketMapper.toPersistence(ticket)

      expect(json.status).toBe('in_progress')
      expect(json.priority).toBe('low')
      expect(json.type).toBe('feature')
      expect(json.privacy).toBe('public')
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })

  describe('toDomain', () => {
    it('should convert persistence format to domain ticket', () => {
      const ticket = TicketMapper.toDomain(sampleTicketJSON)

      expect(ticket.id.value).toBe('test-ticket-123')
      expect(ticket.title.value).toBe('Fix login bug')
      expect(ticket.description.value).toBe('Users cannot login with email')
      expect(ticket.status.value).toBe('pending')
      expect(ticket.priority.value).toBe('high')
      expect(ticket.type).toBe('bug')
      expect(ticket.privacy).toBe('local-only')
      expect(ticket.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
      expect(ticket.updatedAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    })

    it('should handle invalid date format gracefully', () => {
      const invalidJSON = {
        ...sampleTicketJSON,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
      }

      // JavaScript's Date constructor is very lenient,
      // so we expect it to create Invalid Date rather than throw
      const ticket = TicketMapper.toDomain(invalidJSON)
      expect(ticket.createdAt.toString()).toBe('Invalid Date')
      expect(ticket.updatedAt.toString()).toBe('Invalid Date')
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      // Start with JSON, convert to domain, then back to JSON
      const originalJSON = sampleTicketJSON
      const ticket = TicketMapper.toDomain(originalJSON)
      const resultJSON = TicketMapper.toPersistence(ticket)

      expect(resultJSON).toEqual(originalJSON)
    })

    it('should maintain data integrity starting from domain object', () => {
      // Start with domain object, convert to JSON, then back to domain
      const originalTicket = Ticket.create({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'medium',
      })

      const json = TicketMapper.toPersistence(originalTicket)
      const reconstructedTicket = TicketMapper.toDomain(json)

      expect(reconstructedTicket.id.value).toBe(originalTicket.id.value)
      expect(reconstructedTicket.title.value).toBe(originalTicket.title.value)
      expect(reconstructedTicket.description.value).toBe(originalTicket.description.value)
      expect(reconstructedTicket.status.value).toBe(originalTicket.status.value)
      expect(reconstructedTicket.priority.value).toBe(originalTicket.priority.value)
      expect(reconstructedTicket.type).toBe(originalTicket.type)
      expect(reconstructedTicket.privacy).toBe(originalTicket.privacy)
    })
  })

  describe('toDomainList', () => {
    it('should convert array of JSON to array of domain objects', () => {
      const jsonList = [
        sampleTicketJSON,
        { ...sampleTicketJSON, id: 'ticket-2', title: 'Second ticket' },
      ]

      const tickets = TicketMapper.toDomainList(jsonList)

      expect(tickets).toHaveLength(2)
      expect(tickets[0]?.id.value).toBe('test-ticket-123')
      expect(tickets[1]?.id.value).toBe('ticket-2')
      expect(tickets[1]?.title.value).toBe('Second ticket')
    })

    it('should handle empty array', () => {
      const tickets = TicketMapper.toDomainList([])
      expect(tickets).toHaveLength(0)
    })
  })

  describe('toPersistenceList', () => {
    it('should convert array of domain objects to array of JSON', () => {
      const ticket1 = TicketMapper.toDomain(sampleTicketJSON)
      const ticket2 = Ticket.create({
        title: 'Second ticket',
        description: 'Second description',
        priority: 'low',
      })

      const jsonList = TicketMapper.toPersistenceList([ticket1, ticket2])

      expect(jsonList).toHaveLength(2)
      expect(jsonList[0]?.id).toBe('test-ticket-123')
      expect(jsonList[1]?.title).toBe('Second ticket')
    })

    it('should handle empty array', () => {
      const jsonList = TicketMapper.toPersistenceList([])
      expect(jsonList).toHaveLength(0)
    })
  })
})
