import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'
import type { TicketQueryCriteria, TicketRepository } from '@project-manager/application'
import { ConfigurationError } from '@project-manager/base'
import type { Logger } from '@project-manager/base/common/logging'
import { Ticket, type TicketId } from '@project-manager/domain'
import type { TicketJSON } from '../types/persistence-types.ts'
import * as TicketMapper from './mappers/ticket-mapper.ts'

/**
 * DuckDB implementation of the TicketRepository
 * Uses DuckDB for efficient querying and ACID compliance
 */
export class DuckDbTicketRepository implements TicketRepository {
  private connection: DuckDBConnection | null = null
  private instance: DuckDBInstance | null = null
  private initialized = false
  private initializationPromise: Promise<void> | null = null
  private readonly logger: Logger
  private readonly dataPath: string

  constructor(dataPath: string, logger: Logger) {
    this.dataPath = dataPath
    this.logger = logger
  }

  /**
   * Initialize the DuckDB connection and create tables if necessary
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure directory exists
      const dir = dirname(this.dataPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      // For file-based database, create instance with config
      // For in-memory database, use default instance
      if (this.dataPath === ':memory:') {
        this.connection = await DuckDBConnection.create()
      } else {
        // Create instance with database file
        this.instance = await DuckDBInstance.create(this.dataPath)
        this.connection = await this.instance.connect()
      }

      // Create tickets table if not exists with more robust handling
      await this.connection.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          description VARCHAR,
          status VARCHAR NOT NULL,
          priority VARCHAR NOT NULL,
          type VARCHAR NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `)

      this.initialized = true
    } catch (error) {
      // Reset state if initialization fails
      this.initialized = false
      this.connection = null
      this.instance = null
      throw error
    }
  }

  /**
   * Get the connection, initializing if necessary
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (!this.initialized) {
      // Ensure only one initialization happens at a time
      if (!this.initializationPromise) {
        this.initializationPromise = this.initialize()
      }
      await this.initializationPromise
    }
    if (!this.connection) {
      throw new ConfigurationError('DuckDB connection not initialized', 'connection')
    }
    return this.connection
  }

  /**
   * Save a ticket to the database
   */
  async save(ticket: Ticket): Promise<void> {
    const connection = await this.getConnection()
    const data = TicketMapper.toPersistence(ticket)

    // Use INSERT ... ON CONFLICT for upsert behavior
    // This is more reliable than separate check + update/insert
    await connection.run(
      `INSERT INTO tickets (id, title, description, status, priority, type, created_at, updated_at)
       VALUES ('${data.id}', '${data.title}', ${data.description ? `'${data.description}'` : 'NULL'}, '${data.status}', '${data.priority}', '${data.type}', '${data.createdAt}', '${data.updatedAt}')
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         type = EXCLUDED.type,
         updated_at = EXCLUDED.updated_at`
    )
  }

  /**
   * Find a ticket by its ID
   */
  async findById(id: TicketId): Promise<Ticket | null> {
    const connection = await this.getConnection()
    const result = await connection.runAndReadAll(`SELECT * FROM tickets WHERE id = '${id.value}'`)

    const rows = result.getRowObjects()
    if (!rows || rows.length === 0) {
      return null
    }

    const row = rows[0] as any
    const ticketData: TicketJSON = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      type: row.type,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }

    return TicketMapper.toDomain(ticketData)
  }

  /**
   * Query tickets based on criteria
   */
  async queryTickets(criteria: TicketQueryCriteria): Promise<Ticket[]> {
    const connection = await this.getConnection()

    let query = 'SELECT * FROM tickets WHERE 1=1'

    // Add filters
    if (criteria.status) {
      query += ` AND status = '${criteria.status}'`
    }

    if (criteria.priority) {
      query += ` AND priority = '${criteria.priority}'`
    }

    if (criteria.type) {
      query += ` AND type = '${criteria.type}'`
    }

    // Add search
    if (criteria.search) {
      // Use provided searchIn fields, or default to both title and description
      const searchFields =
        criteria.searchIn && criteria.searchIn.length > 0
          ? criteria.searchIn
          : ['title', 'description']

      const searchConditions = searchFields
        .map(field => {
          if (field === 'title' || field === 'description') {
            return `${field} ILIKE '%${criteria.search}%'`
          }
          return null
        })
        .filter(Boolean)

      if (searchConditions.length > 0) {
        query += ` AND (${searchConditions.join(' OR ')})`
      }
    }

    // Add ordering
    query += ' ORDER BY updated_at DESC'

    // Add limit and offset
    if (criteria.limit) {
      query += ` LIMIT ${criteria.limit}`
    }

    if (criteria.offset) {
      query += ` OFFSET ${criteria.offset}`
    }

    const result = await connection.runAndReadAll(query)
    const rows = result.getRowObjects() as any[]

    // Convert rows to TicketJSON format
    const ticketJsonList = rows.map(row => {
      const ticketData: TicketJSON = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        type: row.type,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      }
      return ticketData
    })

    // Convert filtered persistence objects to domain objects with logger
    return TicketMapper.toDomainList(ticketJsonList, this.logger)
  }

  /**
   * Delete a ticket by its ID
   */
  async delete(id: TicketId): Promise<void> {
    const connection = await this.getConnection()
    await connection.run(`DELETE FROM tickets WHERE id = '${id.value}'`)
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      // DuckDBConnection doesn't have a close method, connections auto-disconnect
      this.connection = null
    }
    if (this.instance) {
      // DuckDBInstance also doesn't have a close method, cleanup is automatic
      this.instance = null
    }
    this.initialized = false
    this.initializationPromise = null
  }
}
