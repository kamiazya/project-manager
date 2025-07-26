/**
 * Storage and persistence types for the ticket management domain
 *
 * These types define the structure for LDJSON (Line Delimited JSON) storage
 * of tickets and their aliases.
 */

// /**
//  * Base event interface for all ticket-related events in LDJSON storage
//  */
// export interface BaseTicketEvent {
//   /**
//    * Event type identifier
//    */
//   eventType: string

//   /**
//    * Event timestamp in ISO 8601 format
//    */
//   timestamp: string

//   /**
//    * Version for event schema evolution
//    */
//   version: number

//   /**
//    * Correlation ID for tracking related events
//    */
//   correlationId?: string
// }

// /**
//  * Event for creating a new alias mapping
//  */
// export interface AliasCreatedEvent extends BaseTicketEvent {
//   eventType: 'alias.created'
//   payload: {
//     /**
//      * The alias value (normalized to lowercase)
//      */
//     alias: string

//     /**
//      * The ticket ULID this alias points to
//      */
//     ticketId: string

//     /**
//      * Type of alias (canonical or custom)
//      */
//     type: AliasType

//     /**
//      * The strategy used to generate this alias (for canonical aliases)
//      */
//     generatorStrategy?: string

//     /**
//      * Additional metadata
//      */
//     metadata?: Record<string, unknown>
//   }
// }

// /**
//  * Event for removing an alias mapping
//  */
// export interface AliasRemovedEvent extends BaseTicketEvent {
//   eventType: 'alias.removed'
//   payload: {
//     /**
//      * The alias that was removed
//      */
//     alias: string

//     /**
//      * The ticket ID it was pointing to
//      */
//     ticketId: string

//     /**
//      * Reason for removal (optional)
//      */
//     reason?: string
//   }
// }

/**
 * Union type for all alias-related events
 */
// export type AliasEvent = AliasCreatedEvent | AliasRemovedEvent

/**
 * LDJSON line structure for alias events
 */
// export interface AliasEventLine {
//   /**
//    * The event data
//    */
//   event: AliasEvent

//   /**
//    * Optional sequence number for ordering
//    */
//   sequence?: number

//   /**
//    * Optional checksum for integrity verification
//    */
//   checksum?: string
// }

// /**
//  * In-memory representation of alias mappings
//  * Used for fast lookups and cache management
//  */
// export interface AliasMapping {
//   /**
//    * The alias value
//    */
//   alias: string

//   /**
//    * The ticket ID this alias resolves to
//    */
//   ticketId: string

//   /**
//    * When this mapping was created
//    */
//   createdAt: Date

//   /**
//    * Type of alias
//    */
//   type: AliasType

//   /**
//    * Generator strategy used (for canonical aliases)
//    */
//   generatorStrategy?: string

//   /**
//    * Whether this mapping is active
//    */
//   isActive: boolean
// }

// /**
//  * Configuration for alias storage
//  */
// export interface AliasStorageConfig {
//   /**
//    * File path for the alias events LDJSON file
//    */
//   aliasEventsFile: string

//   /**
//    * Maximum number of events to keep in memory cache
//    */
//   maxCacheSize: number

//   /**
//    * Whether to enable integrity checking with checksums
//    */
//   enableIntegrityCheck: boolean

//   /**
//    * Backup configuration
//    */
//   backup?: {
//     /**
//      * Whether to create backup files
//      */
//     enabled: boolean

//     /**
//      * Number of backup files to keep
//      */
//     maxBackups: number

//     /**
//      * Backup file naming pattern
//      */
//     namePattern: string
//   }
// }

// /**
//  * Error types for alias storage operations
//  */
// export type AliasStorageError =
//   | 'ALIAS_ALREADY_EXISTS'
//   | 'ALIAS_NOT_FOUND'
//   | 'TICKET_NOT_FOUND'
//   | 'INVALID_ALIAS_FORMAT'
//   | 'STORAGE_CORRUPTED'
//   | 'PERMISSION_DENIED'
//   | 'DISK_FULL'

// /**
//  * Result type for alias storage operations
//  */
// export interface AliasStorageResult<T = void> {
//   success: boolean
//   data?: T
//   error?: {
//     type: AliasStorageError
//     message: string
//     details?: Record<string, unknown>
//   }
// }

// /**
//  * Statistics about alias usage
//  */
// export interface AliasStatistics {
//   /**
//    * Total number of active aliases
//    */
//   totalAliases: number

//   /**
//    * Number of canonical aliases
//    */
//   canonicalAliases: number

//   /**
//    * Number of custom aliases
//    */
//   customAliases: number

//   /**
//    * Number of unique tickets with aliases
//    */
//   ticketsWithAliases: number

//   /**
//    * Average number of aliases per ticket
//    */
//   averageAliasesPerTicket: number

//   /**
//    * Most recent alias creation time
//    */
//   latestAliasCreatedAt: Date

//   /**
//    * Storage file size in bytes
//    */
//   storageFileSizeBytes: number
// }

// /**
//  * Snapshot of current alias state for backup/restore
//  */
// export interface AliasSnapshot {
//   /**
//    * When this snapshot was created
//    */
//   createdAt: Date

//   /**
//    * Version of the snapshot format
//    */
//   version: number

//   /**
//    * All active alias mappings
//    */
//   mappings: AliasMapping[]

//   /**
//    * Metadata about the snapshot
//    */
//   metadata: {
//     totalMappings: number
//     sourcePath: string
//     checksum?: string
//   }
// }
