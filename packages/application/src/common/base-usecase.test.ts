import { describe, expect, it, vi } from 'vitest'
import type { UseCase } from './base-usecase.ts'

// Test implementations for UseCase interface
class SimpleUseCase implements UseCase<string, string> {
  async execute(request: string): Promise<string> {
    return `Processed: ${request}`
  }
}

class NumberDoubleUseCase implements UseCase<number, number> {
  async execute(request: number): Promise<number> {
    return request * 2
  }
}

class ComplexDataUseCase
  implements UseCase<{ id: string; data: any }, { result: any; timestamp: string }>
{
  async execute(request: { id: string; data: any }): Promise<{ result: any; timestamp: string }> {
    return {
      result: `ID: ${request.id}, Data: ${JSON.stringify(request.data)}`,
      timestamp: new Date().toISOString(),
    }
  }
}

class AsyncDelayUseCase implements UseCase<number, string> {
  async execute(delayMs: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    return `Delayed for ${delayMs}ms`
  }
}

class ErrorThrowingUseCase implements UseCase<string, never> {
  async execute(message: string): Promise<never> {
    throw new Error(message)
  }
}

class ValidationUseCase
  implements UseCase<{ email: string }, { valid: boolean; message?: string }>
{
  async execute(request: { email: string }): Promise<{ valid: boolean; message?: string }> {
    if (!request.email) {
      return { valid: false, message: 'Email is required' }
    }
    if (!request.email.includes('@')) {
      return { valid: false, message: 'Invalid email format' }
    }
    return { valid: true }
  }
}

describe('UseCase interface', () => {
  describe('interface definition', () => {
    it('should define execute method with generic types', () => {
      const useCase = new SimpleUseCase()

      expect(typeof useCase.execute).toBe('function')
      expect(useCase.execute.length).toBe(1) // Should accept one parameter
    })

    it('should support type-safe request and response', async () => {
      const stringUseCase = new SimpleUseCase()
      const numberUseCase = new NumberDoubleUseCase()

      // TypeScript should enforce type safety at compile time
      const stringResult = await stringUseCase.execute('test input')
      const numberResult = await numberUseCase.execute(42)

      expect(typeof stringResult).toBe('string')
      expect(typeof numberResult).toBe('number')
      expect(stringResult).toBe('Processed: test input')
      expect(numberResult).toBe(84)
    })

    it('should support complex generic types', async () => {
      const complexUseCase = new ComplexDataUseCase()

      const request = {
        id: 'test-123',
        data: { value: 42, items: ['a', 'b', 'c'] },
      }

      const response = await complexUseCase.execute(request)

      expect(response).toHaveProperty('result')
      expect(response).toHaveProperty('timestamp')
      expect(typeof response.result).toBe('string')
      expect(typeof response.timestamp).toBe('string')
      expect(response.result).toContain('test-123')
      expect(response.result).toContain('42')
    })

    it('should support void/undefined request types', () => {
      class NoRequestUseCase implements UseCase<void, string> {
        async execute(): Promise<string> {
          return 'No request needed'
        }
      }

      const useCase = new NoRequestUseCase()
      expect(typeof useCase.execute).toBe('function')
      expect(useCase.execute.length).toBe(0)
    })

    it('should support void/undefined response types', () => {
      class NoResponseUseCase implements UseCase<string, void> {
        async execute(request: string): Promise<void> {
          console.log(`Processing: ${request}`)
          // No return value
        }
      }

      const useCase = new NoResponseUseCase()
      expect(typeof useCase.execute).toBe('function')
    })
  })

  describe('asynchronous execution', () => {
    it('should return Promise from execute method', () => {
      const useCase = new SimpleUseCase()
      const result = useCase.execute('test')

      expect(result).toBeInstanceOf(Promise)
    })

    it('should handle Promise resolution', async () => {
      const useCase = new SimpleUseCase()
      const result = await useCase.execute('async test')

      expect(result).toBe('Processed: async test')
    })

    it('should handle Promise rejection', async () => {
      const errorUseCase = new ErrorThrowingUseCase()

      await expect(errorUseCase.execute('error message')).rejects.toThrow('error message')
    })

    it('should support delayed execution', async () => {
      const delayUseCase = new AsyncDelayUseCase()

      const start = Date.now()
      const result = await delayUseCase.execute(50)
      const duration = Date.now() - start

      expect(result).toBe('Delayed for 50ms')
      expect(duration).toBeGreaterThanOrEqual(45) // Allow some timing variance
    })

    it('should support concurrent execution', async () => {
      const useCase = new NumberDoubleUseCase()

      const promises = [
        useCase.execute(1),
        useCase.execute(2),
        useCase.execute(3),
        useCase.execute(4),
        useCase.execute(5),
      ]

      const results = await Promise.all(promises)

      expect(results).toEqual([2, 4, 6, 8, 10])
    })
  })

  describe('error handling patterns', () => {
    it('should propagate errors from execute method', async () => {
      const errorUseCase = new ErrorThrowingUseCase()

      await expect(errorUseCase.execute('test error')).rejects.toThrow('test error')
    })

    it('should handle validation errors gracefully', async () => {
      const validationUseCase = new ValidationUseCase()

      const invalidResult = await validationUseCase.execute({ email: '' })
      const invalidFormatResult = await validationUseCase.execute({ email: 'invalid-email' })
      const validResult = await validationUseCase.execute({ email: 'test@example.com' })

      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.message).toBe('Email is required')

      expect(invalidFormatResult.valid).toBe(false)
      expect(invalidFormatResult.message).toBe('Invalid email format')

      expect(validResult.valid).toBe(true)
      expect(validResult.message).toBeUndefined()
    })

    it('should handle runtime errors in complex operations', async () => {
      class RuntimeErrorUseCase implements UseCase<any, any> {
        async execute(request: any): Promise<any> {
          // Simulate runtime error
          return request.nonexistent.property.access
        }
      }

      const errorUseCase = new RuntimeErrorUseCase()

      await expect(errorUseCase.execute({})).rejects.toThrow()
    })

    it('should support custom error types', async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message)
          this.name = 'CustomError'
        }
      }

      class CustomErrorUseCase implements UseCase<string, never> {
        async execute(request: string): Promise<never> {
          throw new CustomError(`Custom error: ${request}`, 'CUSTOM_001')
        }
      }

      const customErrorUseCase = new CustomErrorUseCase()

      try {
        await customErrorUseCase.execute('test')
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError)
        expect((error as CustomError).code).toBe('CUSTOM_001')
        expect((error as CustomError).message).toBe('Custom error: test')
      }
    })
  })

  describe('polymorphism and composition', () => {
    it('should support polymorphic usage', async () => {
      const useCases: UseCase<string, string>[] = [
        new SimpleUseCase(),
        {
          async execute(request: string): Promise<string> {
            return request.toUpperCase()
          },
        },
        {
          async execute(request: string): Promise<string> {
            return request.split('').reverse().join('')
          },
        },
      ]

      const results = await Promise.all(useCases.map(useCase => useCase.execute('test')))

      expect(results[0]).toBe('Processed: test')
      expect(results[1]).toBe('TEST')
      expect(results[2]).toBe('tset')
    })

    it('should support use case composition', async () => {
      class UppercaseUseCase implements UseCase<string, string> {
        async execute(request: string): Promise<string> {
          return request.toUpperCase()
        }
      }

      class PrefixUseCase implements UseCase<string, string> {
        constructor(private prefix: string) {}

        async execute(request: string): Promise<string> {
          return `${this.prefix}${request}`
        }
      }

      class CompositeUseCase implements UseCase<string, string> {
        constructor(
          private uppercaseUseCase: UppercaseUseCase,
          private prefixUseCase: PrefixUseCase
        ) {}

        async execute(request: string): Promise<string> {
          const uppercased = await this.uppercaseUseCase.execute(request)
          return await this.prefixUseCase.execute(uppercased)
        }
      }

      const composite = new CompositeUseCase(new UppercaseUseCase(), new PrefixUseCase('PREFIX: '))

      const result = await composite.execute('hello world')
      expect(result).toBe('PREFIX: HELLO WORLD')
    })

    it('should support use case chaining', async () => {
      class Step1UseCase implements UseCase<number, number> {
        async execute(request: number): Promise<number> {
          return request + 10
        }
      }

      class Step2UseCase implements UseCase<number, number> {
        async execute(request: number): Promise<number> {
          return request * 2
        }
      }

      class Step3UseCase implements UseCase<number, string> {
        async execute(request: number): Promise<string> {
          return `Result: ${request}`
        }
      }

      const step1 = new Step1UseCase()
      const step2 = new Step2UseCase()
      const step3 = new Step3UseCase()

      const input = 5
      const result1 = await step1.execute(input) // 5 + 10 = 15
      const result2 = await step2.execute(result1) // 15 * 2 = 30
      const result3 = await step3.execute(result2) // "Result: 30"

      expect(result3).toBe('Result: 30')
    })

    it('should support use case decorators/middleware', async () => {
      interface LoggingDecorator<TRequest, TResponse> extends UseCase<TRequest, TResponse> {
        decoratedUseCase: UseCase<TRequest, TResponse>
      }

      class LoggingDecoratorImpl<TRequest, TResponse>
        implements LoggingDecorator<TRequest, TResponse>
      {
        constructor(
          public decoratedUseCase: UseCase<TRequest, TResponse>,
          private logger: (message: string) => void = console.log
        ) {}

        async execute(request: TRequest): Promise<TResponse> {
          this.logger(`Executing with request: ${JSON.stringify(request)}`)

          try {
            const result = await this.decoratedUseCase.execute(request)
            this.logger(`Execution successful: ${JSON.stringify(result)}`)
            return result
          } catch (error) {
            this.logger(`Execution failed: ${error}`)
            throw error
          }
        }
      }

      const mockLogger = vi.fn()
      const baseUseCase = new NumberDoubleUseCase()
      const decoratedUseCase = new LoggingDecoratorImpl(baseUseCase, mockLogger)

      const result = await decoratedUseCase.execute(21)

      expect(result).toBe(42)
      expect(mockLogger).toHaveBeenCalledWith('Executing with request: 21')
      expect(mockLogger).toHaveBeenCalledWith('Execution successful: 42')
    })
  })

  describe('integration patterns', () => {
    it('should support dependency injection pattern', () => {
      interface Repository {
        save(data: any): Promise<void>
        findById(id: string): Promise<any>
      }

      class MockRepository implements Repository {
        private data = new Map()

        async save(data: any): Promise<void> {
          this.data.set(data.id, data)
        }

        async findById(id: string): Promise<any> {
          return this.data.get(id)
        }
      }

      class CreateUserUseCase implements UseCase<{ name: string }, { id: string; name: string }> {
        constructor(private repository: Repository) {}

        async execute(request: { name: string }): Promise<{ id: string; name: string }> {
          const user = {
            id: `user-${Date.now()}`,
            name: request.name,
          }

          await this.repository.save(user)
          return user
        }
      }

      const repository = new MockRepository()
      const useCase = new CreateUserUseCase(repository)

      expect(useCase).toBeInstanceOf(CreateUserUseCase)
      expect(typeof useCase.execute).toBe('function')
    })

    it('should support factory pattern for use case creation', async () => {
      interface UseCaseFactory {
        createStringProcessor(): UseCase<string, string>
        createNumberProcessor(): UseCase<number, number>
      }

      class ConcreteUseCaseFactory implements UseCaseFactory {
        createStringProcessor(): UseCase<string, string> {
          return new SimpleUseCase()
        }

        createNumberProcessor(): UseCase<number, number> {
          return new NumberDoubleUseCase()
        }
      }

      const factory = new ConcreteUseCaseFactory()
      const stringProcessor = factory.createStringProcessor()
      const numberProcessor = factory.createNumberProcessor()

      const stringResult = await stringProcessor.execute('factory test')
      const numberResult = await numberProcessor.execute(15)

      expect(stringResult).toBe('Processed: factory test')
      expect(numberResult).toBe(30)
    })

    it('should support command/query separation', async () => {
      // Command (modifies state, returns void or simple acknowledgment)
      class CreateTicketCommand implements UseCase<{ title: string }, { id: string }> {
        async execute(request: { title: string }): Promise<{ id: string }> {
          // Simulate creating a ticket
          const id = `ticket-${Date.now()}`
          return { id }
        }
      }

      // Query (reads state, returns data)
      class GetTicketQuery
        implements UseCase<{ id: string }, { id: string; title: string; status: string }>
      {
        async execute(request: {
          id: string
        }): Promise<{ id: string; title: string; status: string }> {
          // Simulate reading a ticket
          return {
            id: request.id,
            title: 'Sample Ticket',
            status: 'pending',
          }
        }
      }

      const createCommand = new CreateTicketCommand()
      const getQuery = new GetTicketQuery()

      const createResult = await createCommand.execute({ title: 'New Ticket' })
      const queryResult = await getQuery.execute({ id: createResult.id })

      expect(createResult).toHaveProperty('id')
      expect(queryResult).toHaveProperty('id')
      expect(queryResult).toHaveProperty('title')
      expect(queryResult).toHaveProperty('status')
    })
  })

  describe('performance characteristics', () => {
    it('should handle rapid sequential execution', async () => {
      const useCase = new NumberDoubleUseCase()

      const start = Date.now()
      const results = []

      for (let i = 0; i < 1000; i++) {
        results.push(await useCase.execute(i))
      }

      const duration = Date.now() - start

      expect(results).toHaveLength(1000)
      expect(results[999]).toBe(1998) // 999 * 2
      expect(duration).toBeLessThan(100) // Should complete quickly
    })

    it('should handle concurrent execution efficiently', async () => {
      const useCase = new NumberDoubleUseCase()

      const start = Date.now()

      const promises = Array.from({ length: 100 }, (_, i) => useCase.execute(i))

      const results = await Promise.all(promises)
      const duration = Date.now() - start

      expect(results).toHaveLength(100)
      expect(results[99]).toBe(198) // 99 * 2
      expect(duration).toBeLessThan(50) // Should complete very quickly
    })

    it('should handle large request/response objects', async () => {
      class LargeDataUseCase implements UseCase<{ items: any[] }, { processedItems: any[] }> {
        async execute(request: { items: any[] }): Promise<{ processedItems: any[] }> {
          return {
            processedItems: request.items.map((item, index) => ({
              ...item,
              processed: true,
              index,
            })),
          }
        }
      }

      const largeDataUseCase = new LargeDataUseCase()
      const largeRequest = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: `item-${i}`,
          data: `data-${i}`,
          value: i,
        })),
      }

      const start = Date.now()
      const result = await largeDataUseCase.execute(largeRequest)
      const duration = Date.now() - start

      expect(result.processedItems).toHaveLength(10000)
      expect(result.processedItems[9999].processed).toBe(true)
      expect(duration).toBeLessThan(200) // Should handle large data efficiently
    })
  })

  describe('edge cases and boundaries', () => {
    it('should handle null and undefined inputs', async () => {
      class NullHandlingUseCase implements UseCase<any, string> {
        async execute(request: any): Promise<string> {
          if (request === null) return 'null received'
          if (request === undefined) return 'undefined received'
          return `value received: ${request}`
        }
      }

      const nullUseCase = new NullHandlingUseCase()

      const nullResult = await nullUseCase.execute(null)
      const undefinedResult = await nullUseCase.execute(undefined)
      const valueResult = await nullUseCase.execute('test')

      expect(nullResult).toBe('null received')
      expect(undefinedResult).toBe('undefined received')
      expect(valueResult).toBe('value received: test')
    })

    it('should handle empty and malformed requests', async () => {
      const validationUseCase = new ValidationUseCase()

      const emptyResult = await validationUseCase.execute({ email: '' })
      const spaceResult = await validationUseCase.execute({ email: '   ' })
      const malformedResult = await validationUseCase.execute({ email: 'not-an-email' })

      expect(emptyResult.valid).toBe(false)
      expect(spaceResult.valid).toBe(false)
      expect(malformedResult.valid).toBe(false)
    })

    it('should handle timeout scenarios', async () => {
      class TimeoutUseCase implements UseCase<number, string> {
        async execute(timeoutMs: number): Promise<string> {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve(`Completed after ${timeoutMs}ms`)
            }, timeoutMs)

            // Simulate timeout cancellation
            if (timeoutMs > 1000) {
              clearTimeout(timer)
              reject(new Error('Operation timed out'))
            }
          })
        }
      }

      const timeoutUseCase = new TimeoutUseCase()

      const quickResult = await timeoutUseCase.execute(50)
      expect(quickResult).toBe('Completed after 50ms')

      await expect(timeoutUseCase.execute(2000)).rejects.toThrow('Operation timed out')
    })
  })
})
