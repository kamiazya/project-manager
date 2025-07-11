/**
 * CLI helper functions for expanding short-form input values
 */

/**
 * Expand priority short forms to full priority values
 * @param short - Short form input (h, m, l) or full name (high, medium, low)
 * @returns Full priority value, defaults to 'medium' for invalid input
 */
export function expandPriority(short: string): 'high' | 'medium' | 'low' {
  switch (short.toLowerCase()) {
    case 'h':
    case 'high':
      return 'high'
    case 'l':
    case 'low':
      return 'low'
    case 'm':
    case 'medium':
      return 'medium'
    default:
      return 'medium'
  }
}

/**
 * Expand type short forms to full type values
 * @param short - Short form input (f, b, t) or full name (feature, bug, task)
 * @returns Full type value, defaults to 'task' for invalid input
 */
export function expandType(short: string): 'feature' | 'bug' | 'task' {
  switch (short.toLowerCase()) {
    case 'f':
    case 'feature':
      return 'feature'
    case 'b':
    case 'bug':
      return 'bug'
    case 't':
    case 'task':
      return 'task'
    default:
      return 'task'
  }
}
