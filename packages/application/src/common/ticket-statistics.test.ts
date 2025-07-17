import { describe, expect, it } from 'vitest'
import { createEmptyTicketStatistics, type TicketStatistics } from './ticket-statistics.ts'

describe('TicketStatistics', () => {
  describe('interface structure', () => {
    it('should define all required statistical properties', () => {
      const stats: TicketStatistics = {
        total: 100,
        pending: 25,
        inProgress: 30,
        completed: 35,
        archived: 10,
        byPriority: {
          high: 20,
          medium: 50,
          low: 30,
        },
        byType: {
          feature: 40,
          bug: 35,
          task: 25,
        },
      }

      expect(stats.total).toBe(100)
      expect(stats.pending).toBe(25)
      expect(stats.inProgress).toBe(30)
      expect(stats.completed).toBe(35)
      expect(stats.archived).toBe(10)
      expect(stats.byPriority.high).toBe(20)
      expect(stats.byPriority.medium).toBe(50)
      expect(stats.byPriority.low).toBe(30)
      expect(stats.byType.feature).toBe(40)
      expect(stats.byType.bug).toBe(35)
      expect(stats.byType.task).toBe(25)
    })

    it('should support zero values', () => {
      const emptyStats: TicketStatistics = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
        byType: {
          feature: 0,
          bug: 0,
          task: 0,
        },
      }

      expect(emptyStats.total).toBe(0)
      expect(emptyStats.byPriority.high).toBe(0)
      expect(emptyStats.byType.feature).toBe(0)
    })

    it('should support large numbers', () => {
      const largeStats: TicketStatistics = {
        total: 1000000,
        pending: 250000,
        inProgress: 300000,
        completed: 350000,
        archived: 100000,
        byPriority: {
          high: 200000,
          medium: 500000,
          low: 300000,
        },
        byType: {
          feature: 400000,
          bug: 350000,
          task: 250000,
        },
      }

      expect(largeStats.total).toBe(1000000)
      expect(largeStats.byPriority.medium).toBe(500000)
      expect(largeStats.byType.feature).toBe(400000)
    })

    it('should support negative numbers for deltas', () => {
      const deltaStats: TicketStatistics = {
        total: -5,
        pending: -2,
        inProgress: 3,
        completed: -4,
        archived: -2,
        byPriority: {
          high: 1,
          medium: -3,
          low: -3,
        },
        byType: {
          feature: -1,
          bug: -2,
          task: -2,
        },
      }

      expect(deltaStats.total).toBe(-5)
      expect(deltaStats.byPriority.medium).toBe(-3)
      expect(deltaStats.byType.bug).toBe(-2)
    })
  })

  describe('business logic compatibility', () => {
    it('should support statistics aggregation', () => {
      const stats1: TicketStatistics = {
        total: 50,
        pending: 10,
        inProgress: 15,
        completed: 20,
        archived: 5,
        byPriority: { high: 10, medium: 25, low: 15 },
        byType: { feature: 20, bug: 15, task: 15 },
      }

      const stats2: TicketStatistics = {
        total: 30,
        pending: 8,
        inProgress: 10,
        completed: 10,
        archived: 2,
        byPriority: { high: 5, medium: 15, low: 10 },
        byType: { feature: 12, bug: 8, task: 10 },
      }

      const aggregated: TicketStatistics = {
        total: stats1.total + stats2.total,
        pending: stats1.pending + stats2.pending,
        inProgress: stats1.inProgress + stats2.inProgress,
        completed: stats1.completed + stats2.completed,
        archived: stats1.archived + stats2.archived,
        byPriority: {
          high: stats1.byPriority.high + stats2.byPriority.high,
          medium: stats1.byPriority.medium + stats2.byPriority.medium,
          low: stats1.byPriority.low + stats2.byPriority.low,
        },
        byType: {
          feature: stats1.byType.feature + stats2.byType.feature,
          bug: stats1.byType.bug + stats2.byType.bug,
          task: stats1.byType.task + stats2.byType.task,
        },
      }

      expect(aggregated.total).toBe(80)
      expect(aggregated.pending).toBe(18)
      expect(aggregated.byPriority.high).toBe(15)
      expect(aggregated.byType.feature).toBe(32)
    })

    it('should support percentage calculations', () => {
      const stats: TicketStatistics = {
        total: 100,
        pending: 25,
        inProgress: 30,
        completed: 35,
        archived: 10,
        byPriority: { high: 20, medium: 50, low: 30 },
        byType: { feature: 40, bug: 35, task: 25 },
      }

      const pendingPercentage = (stats.pending / stats.total) * 100
      const highPriorityPercentage = (stats.byPriority.high / stats.total) * 100
      const featurePercentage = (stats.byType.feature / stats.total) * 100

      expect(pendingPercentage).toBe(25)
      expect(highPriorityPercentage).toBe(20)
      expect(featurePercentage).toBe(40)
    })

    it('should support filtering and grouping operations', () => {
      const stats: TicketStatistics = {
        total: 100,
        pending: 25,
        inProgress: 30,
        completed: 35,
        archived: 10,
        byPriority: { high: 20, medium: 50, low: 30 },
        byType: { feature: 40, bug: 35, task: 25 },
      }

      // Active tickets (pending + in_progress)
      const activeTickets = stats.pending + stats.inProgress
      expect(activeTickets).toBe(55)

      // Completed work (completed + archived)
      const completedWork = stats.completed + stats.archived
      expect(completedWork).toBe(45)

      // Critical items (high priority)
      const criticalItems = stats.byPriority.high
      expect(criticalItems).toBe(20)

      // Development work (feature + bug)
      const developmentWork = stats.byType.feature + stats.byType.bug
      expect(developmentWork).toBe(75)
    })

    it('should handle consistency validation', () => {
      const stats: TicketStatistics = {
        total: 100,
        pending: 25,
        inProgress: 30,
        completed: 35,
        archived: 10,
        byPriority: { high: 20, medium: 50, low: 30 },
        byType: { feature: 40, bug: 35, task: 25 },
      }

      // Status totals should equal total
      const statusSum = stats.pending + stats.inProgress + stats.completed + stats.archived
      expect(statusSum).toBe(stats.total)

      // Priority totals should equal total
      const prioritySum = stats.byPriority.high + stats.byPriority.medium + stats.byPriority.low
      expect(prioritySum).toBe(stats.total)

      // Type totals should equal total
      const typeSum = stats.byType.feature + stats.byType.bug + stats.byType.task
      expect(typeSum).toBe(stats.total)
    })
  })

  describe('serialization and deserialization', () => {
    it('should support JSON serialization', () => {
      const stats: TicketStatistics = {
        total: 50,
        pending: 10,
        inProgress: 15,
        completed: 20,
        archived: 5,
        byPriority: { high: 10, medium: 25, low: 15 },
        byType: { feature: 20, bug: 15, task: 15 },
      }

      const json = JSON.stringify(stats)
      const parsed: TicketStatistics = JSON.parse(json)

      expect(parsed.total).toBe(stats.total)
      expect(parsed.byPriority.high).toBe(stats.byPriority.high)
      expect(parsed.byType.feature).toBe(stats.byType.feature)
    })

    it('should handle nested object serialization', () => {
      const stats: TicketStatistics = {
        total: 100,
        pending: 25,
        inProgress: 30,
        completed: 35,
        archived: 10,
        byPriority: { high: 20, medium: 50, low: 30 },
        byType: { feature: 40, bug: 35, task: 25 },
      }

      const serialized = JSON.stringify(stats, null, 2)
      expect(serialized).toContain('"byPriority"')
      expect(serialized).toContain('"high": 20')
      expect(serialized).toContain('"byType"')
      expect(serialized).toContain('"feature": 40')
    })

    it('should preserve number precision', () => {
      const stats: TicketStatistics = {
        total: 3,
        pending: 1,
        inProgress: 1,
        completed: 1,
        archived: 0,
        byPriority: { high: 1, medium: 1, low: 1 },
        byType: { feature: 1, bug: 1, task: 1 },
      }

      const json = JSON.stringify(stats)
      const parsed: TicketStatistics = JSON.parse(json)

      expect(parsed.total).toBe(3)
      expect(parsed.byPriority.high).toBe(1)
      expect(parsed.byType.feature).toBe(1)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle decimal numbers', () => {
      const stats: TicketStatistics = {
        total: 10.5,
        pending: 2.5,
        inProgress: 3.0,
        completed: 3.5,
        archived: 1.5,
        byPriority: { high: 2.5, medium: 5.0, low: 3.0 },
        byType: { feature: 4.0, bug: 3.5, task: 3.0 },
      }

      expect(stats.total).toBe(10.5)
      expect(stats.byPriority.high).toBe(2.5)
      expect(stats.byType.feature).toBe(4.0)
    })

    it('should handle very large numbers', () => {
      const stats: TicketStatistics = {
        total: Number.MAX_SAFE_INTEGER,
        pending: Math.floor(Number.MAX_SAFE_INTEGER / 4),
        inProgress: Math.floor(Number.MAX_SAFE_INTEGER / 4),
        completed: Math.floor(Number.MAX_SAFE_INTEGER / 4),
        archived: Math.floor(Number.MAX_SAFE_INTEGER / 4),
        byPriority: {
          high: Math.floor(Number.MAX_SAFE_INTEGER / 3),
          medium: Math.floor(Number.MAX_SAFE_INTEGER / 3),
          low: Math.floor(Number.MAX_SAFE_INTEGER / 3),
        },
        byType: {
          feature: Math.floor(Number.MAX_SAFE_INTEGER / 3),
          bug: Math.floor(Number.MAX_SAFE_INTEGER / 3),
          task: Math.floor(Number.MAX_SAFE_INTEGER / 3),
        },
      }

      expect(stats.total).toBe(Number.MAX_SAFE_INTEGER)
      expect(Number.isSafeInteger(stats.total)).toBe(true)
    })

    it('should handle infinity values', () => {
      const stats: TicketStatistics = {
        total: Infinity,
        pending: Infinity,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: { high: Infinity, medium: 0, low: 0 },
        byType: { feature: Infinity, bug: 0, task: 0 },
      }

      expect(stats.total).toBe(Infinity)
      expect(stats.byPriority.high).toBe(Infinity)
      expect(stats.byType.feature).toBe(Infinity)
    })

    it('should handle NaN values', () => {
      const stats: TicketStatistics = {
        total: NaN,
        pending: NaN,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: { high: NaN, medium: 0, low: 0 },
        byType: { feature: NaN, bug: 0, task: 0 },
      }

      expect(Number.isNaN(stats.total)).toBe(true)
      expect(Number.isNaN(stats.byPriority.high)).toBe(true)
      expect(Number.isNaN(stats.byType.feature)).toBe(true)
    })
  })

  describe('reporting and display scenarios', () => {
    it('should support dashboard summary calculations', () => {
      const stats: TicketStatistics = {
        total: 1000,
        pending: 200,
        inProgress: 300,
        completed: 400,
        archived: 100,
        byPriority: { high: 150, medium: 500, low: 350 },
        byType: { feature: 400, bug: 350, task: 250 },
      }

      // Common dashboard metrics
      const completionRate = (stats.completed / stats.total) * 100
      const workInProgress = stats.inProgress
      const backlogSize = stats.pending
      const urgentItems = stats.byPriority.high
      const developmentLoad = stats.byType.feature + stats.byType.bug

      expect(completionRate).toBe(40)
      expect(workInProgress).toBe(300)
      expect(backlogSize).toBe(200)
      expect(urgentItems).toBe(150)
      expect(developmentLoad).toBe(750)
    })

    it('should support trend analysis', () => {
      const currentStats: TicketStatistics = {
        total: 100,
        pending: 20,
        inProgress: 30,
        completed: 40,
        archived: 10,
        byPriority: { high: 15, medium: 50, low: 35 },
        byType: { feature: 45, bug: 30, task: 25 },
      }

      const previousStats: TicketStatistics = {
        total: 90,
        pending: 25,
        inProgress: 25,
        completed: 35,
        archived: 5,
        byPriority: { high: 20, medium: 45, low: 25 },
        byType: { feature: 40, bug: 25, task: 25 },
      }

      // Calculate trends
      const totalGrowth = currentStats.total - previousStats.total
      const completedGrowth = currentStats.completed - previousStats.completed
      const pendingReduction = previousStats.pending - currentStats.pending
      const highPriorityChange = currentStats.byPriority.high - previousStats.byPriority.high

      expect(totalGrowth).toBe(10)
      expect(completedGrowth).toBe(5)
      expect(pendingReduction).toBe(5)
      expect(highPriorityChange).toBe(-5)
    })

    it('should support capacity planning', () => {
      const stats: TicketStatistics = {
        total: 500,
        pending: 100,
        inProgress: 50,
        completed: 300,
        archived: 50,
        byPriority: { high: 75, medium: 250, low: 175 },
        byType: { feature: 200, bug: 150, task: 150 },
      }

      // Capacity planning metrics
      const activeTasks = stats.pending + stats.inProgress
      const throughputCapacity = stats.completed + stats.archived
      const criticalWorkload = stats.byPriority.high
      const maintenanceWork = stats.byType.bug + stats.byType.task

      expect(activeTasks).toBe(150)
      expect(throughputCapacity).toBe(350)
      expect(criticalWorkload).toBe(75)
      expect(maintenanceWork).toBe(300)
    })
  })
})

describe('createEmptyTicketStatistics', () => {
  describe('factory function', () => {
    it('should create statistics with all zero values', () => {
      const empty = createEmptyTicketStatistics()

      expect(empty.total).toBe(0)
      expect(empty.pending).toBe(0)
      expect(empty.inProgress).toBe(0)
      expect(empty.completed).toBe(0)
      expect(empty.archived).toBe(0)
      expect(empty.byPriority.high).toBe(0)
      expect(empty.byPriority.medium).toBe(0)
      expect(empty.byPriority.low).toBe(0)
      expect(empty.byType.feature).toBe(0)
      expect(empty.byType.bug).toBe(0)
      expect(empty.byType.task).toBe(0)
    })

    it('should create a new instance each time', () => {
      const empty1 = createEmptyTicketStatistics()
      const empty2 = createEmptyTicketStatistics()

      expect(empty1).not.toBe(empty2) // Different object references
      expect(empty1).toEqual(empty2) // Same content
    })

    it('should create mutable objects', () => {
      const empty = createEmptyTicketStatistics()

      // Should be able to modify the returned object
      empty.total = 10
      empty.pending = 5
      empty.byPriority.high = 3

      expect(empty.total).toBe(10)
      expect(empty.pending).toBe(5)
      expect(empty.byPriority.high).toBe(3)
    })

    it('should support modification without affecting future calls', () => {
      const empty1 = createEmptyTicketStatistics()
      empty1.total = 100
      empty1.byPriority.high = 50

      const empty2 = createEmptyTicketStatistics()

      expect(empty2.total).toBe(0)
      expect(empty2.byPriority.high).toBe(0)
    })

    it('should create valid TicketStatistics interface', () => {
      const empty = createEmptyTicketStatistics()

      // Type check - should be assignable to TicketStatistics
      const stats: TicketStatistics = empty

      expect(stats).toBeDefined()
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.byPriority).toBe('object')
      expect(typeof stats.byType).toBe('object')
    })
  })

  describe('use cases', () => {
    it('should support initialization for statistics calculation', () => {
      const stats = createEmptyTicketStatistics()

      // Simulate adding ticket counts
      stats.total = 50
      stats.pending = 15
      stats.inProgress = 20
      stats.completed = 15
      stats.byPriority.high = 10
      stats.byPriority.medium = 25
      stats.byPriority.low = 15
      stats.byType.feature = 20
      stats.byType.bug = 15
      stats.byType.task = 15

      expect(stats.total).toBe(50)
      expect(stats.pending + stats.inProgress + stats.completed).toBe(50)
      expect(stats.byPriority.high + stats.byPriority.medium + stats.byPriority.low).toBe(50)
      expect(stats.byType.feature + stats.byType.bug + stats.byType.task).toBe(50)
    })

    it('should support accumulation pattern', () => {
      const accumulator = createEmptyTicketStatistics()

      // Simulate accumulating statistics from multiple sources
      const source1 = { total: 10, pending: 3, high: 2, feature: 4 }
      const source2 = { total: 15, pending: 5, high: 3, feature: 6 }
      const source3 = { total: 20, pending: 8, high: 4, feature: 8 }

      accumulator.total += source1.total + source2.total + source3.total
      accumulator.pending += source1.pending + source2.pending + source3.pending
      accumulator.byPriority.high += source1.high + source2.high + source3.high
      accumulator.byType.feature += source1.feature + source2.feature + source3.feature

      expect(accumulator.total).toBe(45)
      expect(accumulator.pending).toBe(16)
      expect(accumulator.byPriority.high).toBe(9)
      expect(accumulator.byType.feature).toBe(18)
    })

    it('should support baseline establishment', () => {
      const baseline = createEmptyTicketStatistics()

      // Should start with clean slate
      expect(
        Object.values(baseline).every(value => {
          if (typeof value === 'number') return value === 0
          if (typeof value === 'object') return Object.values(value).every(v => v === 0)
          return false
        })
      ).toBe(true)
    })

    it('should support comparison operations', () => {
      const empty1 = createEmptyTicketStatistics()
      const empty2 = createEmptyTicketStatistics()

      // Should be deeply equal when empty
      expect(JSON.stringify(empty1)).toBe(JSON.stringify(empty2))

      // Should differ after modification
      empty1.total = 10
      expect(JSON.stringify(empty1)).not.toBe(JSON.stringify(empty2))
    })
  })

  describe('performance characteristics', () => {
    it('should create instances efficiently', () => {
      const start = Date.now()

      const instances = []
      for (let i = 0; i < 1000; i++) {
        instances.push(createEmptyTicketStatistics())
      }

      const duration = Date.now() - start

      expect(instances).toHaveLength(1000)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should create lightweight objects', () => {
      const empty = createEmptyTicketStatistics()
      const json = JSON.stringify(empty)

      // Should be relatively small when serialized
      expect(json.length).toBeLessThan(200)
      expect(json).toContain('"total":0')
      expect(json).toContain('"byPriority"')
      expect(json).toContain('"byType"')
    })
  })

  describe('immutability considerations', () => {
    it('should allow independent modification of nested objects', () => {
      const stats1 = createEmptyTicketStatistics()
      const stats2 = createEmptyTicketStatistics()

      stats1.byPriority.high = 10
      stats1.byType.feature = 15

      expect(stats2.byPriority.high).toBe(0)
      expect(stats2.byType.feature).toBe(0)
    })

    it('should create deep copies of nested structures', () => {
      const stats1 = createEmptyTicketStatistics()
      const stats2 = createEmptyTicketStatistics()

      expect(stats1.byPriority).not.toBe(stats2.byPriority)
      expect(stats1.byType).not.toBe(stats2.byType)
    })
  })
})
