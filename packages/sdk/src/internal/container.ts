/**
 * Internal inversify container configuration
 * This file handles all dependency injection setup for the SDK
 */

import {
  AddCustomAliasUseCase,
  ApplicationLogger,
  type AsyncContextStorage,
  AuditInterceptor,
  auditMetadataGenerator,
  ClearCustomAliasesUseCase,
  CreateTicket,
  DeleteTicket,
  type DevelopmentProcessService,
  type EnvironmentDetectionService,
  FindTicketByAliasUseCase,
  GetAuditLogs,
  GetLogs,
  GetTicketById,
  type IdGenerator,
  ListAliasesUseCase,
  type LoggingContext,
  type LoggingContextService,
  PromoteCustomAliasUseCase,
  RegenerateCanonicalAliasUseCase,
  RemoveCustomAliasUseCase,
  RenameCustomAliasUseCase,
  SearchTickets,
  type StorageConfigService,
  type TicketRepository,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
  ValidateAliasUseCase,
} from '@project-manager/application'
import { isDevelopmentLike, isMemoryEnvironment } from '@project-manager/base'
import type { AuditLogger, Logger } from '@project-manager/base/common/logging'
import type { AliasGenerator } from '@project-manager/domain'
import {
  AsyncLocalStorageContextService,
  CrossPlatformStorageConfigService,
  FileAuditReader,
  FileLogReader,
  InMemoryTicketRepository,
  JsonTicketRepository,
  NodeAsyncLocalStorage,
  NodeEnvironmentDetectionService,
  TailBasedAliasGenerator,
  UlidIdGenerator,
  XdgDevelopmentProcessService,
} from '@project-manager/infrastructure'
import { Container } from 'inversify'
import { getGlobalLoggerFactory } from '../logging/logger-factory.ts'
import type { SDKConfig } from '../project-manager-sdk.ts'
import { TYPES } from './types.ts'

export function createContainer(config: SDKConfig): Container {
  const container = new Container({
    defaultScope: 'Singleton',
  })

  // Environment Detection Service - binds concrete implementation
  container
    .bind<EnvironmentDetectionService>(TYPES.EnvironmentDetectionService)
    .toDynamicValue(() => new NodeEnvironmentDetectionService())
    .inSingletonScope()

  // Storage Config Service - binds cross-platform implementation
  container
    .bind<StorageConfigService>(TYPES.StorageConfigService)
    .toDynamicValue(() => {
      // Get environment mode for storage directory naming
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const _environment = envService.resolveEnvironment(config.environment)

      // Create cross-platform service with environment context
      return new CrossPlatformStorageConfigService()
    })
    .inSingletonScope()

  // ID Generator Service - binds ULID implementation
  container
    .bind<IdGenerator>(TYPES.IdGenerator)
    .toDynamicValue(() => new UlidIdGenerator())
    .inSingletonScope()

  // Alias Generator Service - binds tail-based implementation
  container
    .bind<AliasGenerator>(TYPES.AliasGenerator)
    .toDynamicValue(() => new TailBasedAliasGenerator())
    .inSingletonScope()

  // Repository binding - environment-based selection
  container
    .bind<TicketRepository>(TYPES.TicketRepository)
    .toDynamicValue(() => {
      // Resolve environment and create appropriate repository
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(config.environment)

      if (isMemoryEnvironment(environment)) {
        return new InMemoryTicketRepository()
      } else {
        // Use StorageConfigService for path resolution (Clean Architecture compliant)
        const storageService = container.get<StorageConfigService>(TYPES.StorageConfigService)
        const storagePath = storageService.resolveStoragePath()
        const logger = container.get<Logger>(TYPES.BaseLogger)
        return new JsonTicketRepository(storagePath, logger)
      }
    })
    .inSingletonScope()

  // Development Process Service - conditional binding for development-like environments
  const envService = container.get<EnvironmentDetectionService>(TYPES.EnvironmentDetectionService)
  const environment = envService.resolveEnvironment(config.environment)
  if (isDevelopmentLike(environment)) {
    container
      .bind<DevelopmentProcessService>(TYPES.DevelopmentProcessService)
      .toDynamicValue(() => {
        return new XdgDevelopmentProcessService(environment)
      })
      .inSingletonScope()
  }

  // Logging Services Setup
  // AsyncContextStorage for context management
  container
    .bind<AsyncContextStorage<LoggingContext>>(TYPES.AsyncContextStorage)
    .toConstantValue(new NodeAsyncLocalStorage<LoggingContext>())

  // LoggerFactory and base logging services
  container
    .bind<Logger>(TYPES.BaseLogger)
    .toDynamicValue(() => {
      // Get environment from environment detection service
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(config.environment) as
        | 'development'
        | 'production'
        | 'testing'

      const loggerFactory = getGlobalLoggerFactory({ environment })
      return loggerFactory.getApplicationLogger()
    })
    .inTransientScope()

  container
    .bind<AuditLogger>(TYPES.AuditLogger)
    .toDynamicValue(() => {
      // Get environment from environment detection service
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(config.environment) as
        | 'development'
        | 'production'
        | 'testing'

      const loggerFactory = getGlobalLoggerFactory({ environment })
      return loggerFactory.getAuditLogger()
    })
    .inSingletonScope()

  // ApplicationLogger with context integration
  container
    .bind<ApplicationLogger>(TYPES.ApplicationLogger)
    .toDynamicValue(context => {
      const baseLogger = context.get<Logger>(TYPES.BaseLogger)
      const contextService = context.get<LoggingContextService>(TYPES.LoggingContextService)
      const idGenerator = context.get<IdGenerator>(TYPES.IdGenerator)
      return new ApplicationLogger(baseLogger, contextService, idGenerator)
    })
    .inTransientScope()

  // AuditInterceptor for UseCase auditing
  container
    .bind<AuditInterceptor>(TYPES.AuditInterceptor)
    .toDynamicValue(context => {
      const auditLogger = context.get<AuditLogger>(TYPES.AuditLogger)
      const logger = context.get<Logger>(TYPES.BaseLogger)
      const idGenerator = context.get<IdGenerator>(TYPES.IdGenerator)
      const contextService = context.get<LoggingContextService>(TYPES.LoggingContextService)
      return new AuditInterceptor(auditLogger, logger, idGenerator, contextService)
    })
    .inSingletonScope()

  // LoggingContextService - singleton service with dependency injection
  container
    .bind<LoggingContextService>(TYPES.LoggingContextService)
    .toDynamicValue(context => {
      const asyncContextStorage = context.get<AsyncContextStorage<LoggingContext>>(
        TYPES.AsyncContextStorage
      )
      return new AsyncLocalStorageContextService(asyncContextStorage)
    })
    .inSingletonScope()

  // Use case bindings with logging and audit integration
  container
    .bind(TYPES.CreateTicketUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      const idGenerator = container.get<IdGenerator>(TYPES.IdGenerator)
      const aliasGenerator = container.get<AliasGenerator>(TYPES.AliasGenerator)
      return new CreateTicket.UseCase(repo, idGenerator, aliasGenerator)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.GetTicketByIdUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new GetTicketById.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.UpdateTicketStatusUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new UpdateTicketStatus.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.UpdateTicketContentUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new UpdateTicketContent.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.UpdateTicketPriorityUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new UpdateTicketPriority.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.DeleteTicketUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new DeleteTicket.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.SearchTicketsUseCase)
    .toDynamicValue(() => {
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      return new SearchTickets.UseCase(repo)
    })
    .onActivation(createUseCaseActivationHandler(container))

  // Log and Audit Readers
  container
    .bind<FileLogReader>(TYPES.LogReader)
    .toDynamicValue(context => {
      const storageService = container.get<StorageConfigService>(TYPES.StorageConfigService)
      // Get logs directory from storage config (logs are typically in ~/.local/share/project-manager/logs/)
      const logsDir = storageService.getLogsPath()
      const logger = context.get<Logger>(TYPES.BaseLogger)
      return new FileLogReader(logsDir, logger)
    })
    .inSingletonScope()

  container
    .bind<FileAuditReader>(TYPES.AuditReader)
    .toDynamicValue(context => {
      const storageService = container.get<StorageConfigService>(TYPES.StorageConfigService)
      // Get logs directory from storage config (audit logs are in the same logs directory)
      const logsDir = storageService.getLogsPath()
      const logger = context.get<Logger>(TYPES.BaseLogger)
      return new FileAuditReader(logsDir, logger)
    })
    .inSingletonScope()

  // Log and Audit Use Cases
  container
    .bind(TYPES.GetLogsUseCase)
    .toDynamicValue(context => {
      const logReader = context.get<FileLogReader>(TYPES.LogReader)
      return new GetLogs.UseCase(logReader as any)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.GetAuditLogsUseCase)
    .toDynamicValue(context => {
      const auditReader = context.get<FileAuditReader>(TYPES.AuditReader)
      return new GetAuditLogs.UseCase(auditReader as any)
    })
    .onActivation(createUseCaseActivationHandler(container))

  // Alias Use Cases
  container
    .bind(TYPES.AddCustomAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new AddCustomAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.ListAliasesUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new ListAliasesUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.RemoveCustomAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new RemoveCustomAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.RenameCustomAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new RenameCustomAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.PromoteCustomAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new PromoteCustomAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.RegenerateCanonicalAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      const aliasGenerator = context.get<any>(TYPES.AliasGenerator)
      return new RegenerateCanonicalAliasUseCase(ticketRepository, aliasGenerator)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.ClearCustomAliasesUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new ClearCustomAliasesUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.FindTicketByAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new FindTicketByAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  container
    .bind(TYPES.ValidateAliasUseCase)
    .toDynamicValue(context => {
      const ticketRepository = context.get<TicketRepository>(TYPES.TicketRepository)
      return new ValidateAliasUseCase(ticketRepository)
    })
    .onActivation(createUseCaseActivationHandler(container))

  return container
}

/**
 * Create an onActivation handler for UseCase instances.
 * This implements the Proxy pattern to intercept execute calls and add
 * logging and audit functionality transparently.
 *
 * @param container - The DI container instance
 * @returns onActivation handler function
 */
function createUseCaseActivationHandler(container: Container) {
  return (_context: any, useCase: any) => {
    // Inject ApplicationLogger into the UseCase
    const applicationLogger = container.get<ApplicationLogger>(TYPES.ApplicationLogger)
    useCase.logger = applicationLogger

    // Get AuditInterceptor for audit recording
    const auditInterceptor = container.get<AuditInterceptor>(TYPES.AuditInterceptor)

    // Ensure useCase has audit metadata
    if (!useCase.auditMetadata) {
      // Generate default audit metadata based on class name
      useCase.auditMetadata = auditMetadataGenerator.generateMetadata(useCase)
    }

    // Store the original execute method
    const originalExecute = useCase.execute.bind(useCase)

    // Replace execute method with Proxy that adds logging and audit
    useCase.execute = new Proxy(originalExecute, {
      async apply(target, thisArg, argumentsList: any[]) {
        const [request] = argumentsList
        const useCaseName = useCase.constructor.name.replace(/UseCase$/, '')
        const startTime = Date.now()

        // Generate unique execution ID
        const executionId = generateExecutionId()

        // Declare beforeState outside try block so it's available in catch
        let beforeState: any

        try {
          // Pre-execution logging
          await applicationLogger.logUseCaseStart(useCaseName, request, executionId)

          // Capture before state if defined
          if (useCase.auditMetadata.extractBeforeState) {
            try {
              beforeState = await useCase.auditMetadata.extractBeforeState(request)
            } catch (beforeStateError: unknown) {
              const errorMessage =
                beforeStateError instanceof Error ? beforeStateError.message : 'Unknown error'
              await applicationLogger.warn('Failed to capture before state', {
                useCase: useCaseName,
                executionId,
                error: errorMessage,
              })
            }
          }

          // Execute the actual UseCase
          const result = await Reflect.apply(target, thisArg, argumentsList)
          const endTime = Date.now()
          const duration = endTime - startTime

          // Post-execution logging
          await applicationLogger.logUseCaseSuccess(useCaseName, duration, result, executionId)

          // Record audit trail - all UseCases are now auditable
          await auditInterceptor.recordSuccess(
            useCase,
            request,
            result,
            startTime,
            endTime,
            beforeState
          )

          return result
        } catch (error: any) {
          const endTime = Date.now()
          const duration = endTime - startTime

          // Error logging
          await applicationLogger.logUseCaseError(useCaseName, error, duration, executionId)

          // Record audit trail for failed execution
          await auditInterceptor.recordFailure(
            useCase,
            request,
            error,
            startTime,
            endTime,
            beforeState
          )

          // Re-throw the original error
          throw error
        }
      },
    })

    return useCase
  }
}

/**
 * Generate a unique execution ID for tracking individual UseCase executions.
 *
 * @returns Unique execution identifier
 */
function generateExecutionId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `exec-${timestamp}-${random}`
}
