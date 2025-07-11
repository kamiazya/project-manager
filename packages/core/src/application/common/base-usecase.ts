/**
 * Base interface for all use cases following the Command/Query pattern.
 * Each use case should implement this interface and provide the execute method.
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>
}
