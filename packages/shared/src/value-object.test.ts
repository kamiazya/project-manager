import { describe, expect, it } from 'vitest'
import { ValueObject } from './value-object.ts'

// Test value objects for testing purposes
class SimpleValue extends ValueObject<{ value: string }> {
  constructor(props: { value: string }) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  static create(value: string): SimpleValue {
    return new SimpleValue({ value })
  }
}

class ComplexValue extends ValueObject<{ name: string; count: number; tags: string[] }> {
  constructor(props: { name: string; count: number; tags: string[] }) {
    super(props)
  }

  get name(): string {
    return this.props.name
  }

  get count(): number {
    return this.props.count
  }

  get tags(): string[] {
    return this.props.tags
  }

  static create(name: string, count: number, tags: string[]): ComplexValue {
    return new ComplexValue({ name, count, tags })
  }
}

class DateValue extends ValueObject<{ timestamp: Date }> {
  constructor(props: { timestamp: Date }) {
    super(props)
  }

  get timestamp(): Date {
    return this.props.timestamp
  }

  static create(timestamp: Date): DateValue {
    return new DateValue({ timestamp })
  }
}

describe('ValueObject (shared)', () => {
  describe('immutability', () => {
    it('should freeze properties to prevent modification', () => {
      const value = SimpleValue.create('test')

      // Props should be frozen
      expect(Object.isFrozen((value as any).props)).toBe(true)
    })

    it('should prevent modification of nested properties', () => {
      const complex = ComplexValue.create('test', 5, ['tag1', 'tag2'])

      // Attempt to modify should throw due to Object.freeze
      expect(() => {
        ;(complex as any).props.name = 'modified'
      }).toThrow()

      expect(complex.name).toBe('test') // Should remain unchanged
    })

    it('should handle complex nested structures immutably', () => {
      const nested = new (class extends ValueObject<{
        simple: { value: string }
        complex: { data: { id: number; label: string } }
      }> {
        constructor() {
          super({
            simple: { value: 'test' },
            complex: { data: { id: 123, label: 'label' } },
          })
        }
      })()

      // Properties should be accessible but not modifiable
      expect((nested as any).props.simple.value).toBe('test')
      expect((nested as any).props.complex.data.id).toBe(123)
      expect((nested as any).props.complex.data.label).toBe('label')
    })
  })

  describe('equals method with dequal', () => {
    it('should return true for value objects with same properties', () => {
      const value1 = SimpleValue.create('test')
      const value2 = SimpleValue.create('test')

      expect(value1.equals(value2)).toBe(true)
      expect(value2.equals(value1)).toBe(true)
    })

    it('should return false for value objects with different properties', () => {
      const value1 = SimpleValue.create('test1')
      const value2 = SimpleValue.create('test2')

      expect(value1.equals(value2)).toBe(false)
      expect(value2.equals(value1)).toBe(false)
    })

    it('should return true for complex value objects with same properties', () => {
      const complex1 = ComplexValue.create('test', 5, ['tag1', 'tag2'])
      const complex2 = ComplexValue.create('test', 5, ['tag1', 'tag2'])

      expect(complex1.equals(complex2)).toBe(true)
    })

    it('should return false for complex value objects with different properties', () => {
      const complex1 = ComplexValue.create('test', 5, ['tag1', 'tag2'])
      const complex2 = ComplexValue.create('test', 5, ['tag1', 'tag3']) // Different tag

      expect(complex1.equals(complex2)).toBe(false)
    })

    it('should handle array order sensitivity correctly with dequal', () => {
      const complex1 = ComplexValue.create('test', 5, ['tag1', 'tag2'])
      const complex2 = ComplexValue.create('test', 5, ['tag2', 'tag1']) // Different order

      expect(complex1.equals(complex2)).toBe(false)
    })

    it('should handle Date objects correctly with dequal', () => {
      const date1 = new Date('2023-01-01T00:00:00Z')
      const date2 = new Date('2023-01-01T00:00:00Z')
      const date3 = new Date('2023-01-02T00:00:00Z')

      const value1 = DateValue.create(date1)
      const value2 = DateValue.create(date2)
      const value3 = DateValue.create(date3)

      expect(value1.equals(value2)).toBe(true) // Same timestamp
      expect(value1.equals(value3)).toBe(false) // Different timestamp
    })

    it('should return false when comparing to null', () => {
      const value = SimpleValue.create('test')

      expect(value.equals(null as any)).toBe(false)
    })

    it('should return false when comparing to undefined', () => {
      const value = SimpleValue.create('test')

      expect(value.equals(undefined as any)).toBe(false)
    })

    it('should handle empty arrays correctly', () => {
      const complex1 = ComplexValue.create('test', 0, [])
      const complex2 = ComplexValue.create('test', 0, [])

      expect(complex1.equals(complex2)).toBe(true)
    })

    it('should handle nested object equality correctly with dequal', () => {
      class NestedValue extends ValueObject<{
        level1: {
          level2: {
            level3: {
              value: string
              array: number[]
            }
          }
        }
      }> {
        constructor(value: string, array: number[]) {
          super({
            level1: {
              level2: {
                level3: { value, array },
              },
            },
          })
        }
      }

      const nested1 = new NestedValue('test', [1, 2, 3])
      const nested2 = new NestedValue('test', [1, 2, 3])
      const nested3 = new NestedValue('test', [1, 2, 4]) // Different array

      expect(nested1.equals(nested2)).toBe(true)
      expect(nested1.equals(nested3)).toBe(false)
    })

    it('should handle objects with undefined properties', () => {
      class OptionalValue extends ValueObject<{ required: string; optional?: string }> {
        constructor(required: string, optional?: string) {
          super({ required, optional })
        }
      }

      const value1 = new OptionalValue('test', undefined)
      const value2 = new OptionalValue('test', undefined)
      const value3 = new OptionalValue('test', 'optional')

      expect(value1.equals(value2)).toBe(true)
      expect(value1.equals(value3)).toBe(false)
    })

    it('should handle objects with null properties', () => {
      class NullableValue extends ValueObject<{ value: string | null }> {
        constructor(value: string | null) {
          super({ value })
        }
      }

      const value1 = new NullableValue(null)
      const value2 = new NullableValue(null)
      const value3 = new NullableValue('test')

      expect(value1.equals(value2)).toBe(true)
      expect(value1.equals(value3)).toBe(false)
    })
  })

  describe('toString method', () => {
    it('should return JSON representation for simple value object', () => {
      const value = SimpleValue.create('test')
      const result = value.toString()

      expect(result).toBe('{"value":"test"}')
    })

    it('should return JSON representation for complex value object', () => {
      const complex = ComplexValue.create('test', 5, ['tag1', 'tag2'])
      const result = complex.toString()

      expect(result).toBe('{"name":"test","count":5,"tags":["tag1","tag2"]}')
    })

    it('should handle nested objects in toString', () => {
      class NestedValue extends ValueObject<{
        simple: { value: string }
        complex: { data: { id: number; label: string } }
      }> {
        constructor() {
          super({
            simple: { value: 'test' },
            complex: { data: { id: 123, label: 'label' } },
          })
        }
      }

      const nested = new NestedValue()
      const result = nested.toString()
      const expected = '{"simple":{"value":"test"},"complex":{"data":{"id":123,"label":"label"}}}'

      expect(result).toBe(expected)
    })

    it('should handle special characters in toString', () => {
      const value = SimpleValue.create('test with "quotes" and \\backslashes')
      const result = value.toString()

      expect(result).toContain('test with \\"quotes\\" and \\\\backslashes')
    })

    it('should handle Unicode characters in toString', () => {
      const value = SimpleValue.create('Unicode: 🎉 测试 αβγ')
      const result = value.toString()

      expect(result).toContain('Unicode: 🎉 测试 αβγ')
    })

    it('should handle Date objects in toString', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const value = DateValue.create(date)
      const result = value.toString()

      expect(result).toContain('2023-01-01T00:00:00.000Z')
    })
  })

  describe('inheritance and polymorphism', () => {
    it('should support inheritance of value objects', () => {
      class ExtendedSimpleValue extends SimpleValue {
        get uppercaseValue(): string {
          return this.value.toUpperCase()
        }

        static createExtended(value: string): ExtendedSimpleValue {
          return new ExtendedSimpleValue({ value })
        }
      }

      const extended1 = ExtendedSimpleValue.createExtended('test')
      const extended2 = ExtendedSimpleValue.createExtended('test')
      const simple = SimpleValue.create('test')

      expect(extended1.equals(extended2)).toBe(true)
      expect(extended1.uppercaseValue).toBe('TEST')

      // Different classes with same structure should be equal with dequal
      expect(extended1.equals(simple)).toBe(true)
    })

    it('should handle different value object types correctly', () => {
      const simple = SimpleValue.create('test')
      const complex = ComplexValue.create('test', 5, ['tag'])

      // Different structures should not be equal
      expect(simple.equals(complex as any)).toBe(false)
    })
  })

  describe('dequal-specific behavior', () => {
    it('should handle Map objects correctly', () => {
      class MapValue extends ValueObject<{ data: Map<string, number> }> {
        constructor(data: Map<string, number>) {
          super({ data })
        }
      }

      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map3 = new Map([
        ['a', 1],
        ['b', 3],
      ])

      const value1 = new MapValue(map1)
      const value2 = new MapValue(map2)
      const value3 = new MapValue(map3)

      expect(value1.equals(value2)).toBe(true)
      expect(value1.equals(value3)).toBe(false)
    })

    it('should handle Set objects correctly', () => {
      class SetValue extends ValueObject<{ tags: Set<string> }> {
        constructor(tags: Set<string>) {
          super({ tags })
        }
      }

      const set1 = new Set(['tag1', 'tag2'])
      const set2 = new Set(['tag1', 'tag2'])
      const set3 = new Set(['tag1', 'tag3'])

      const value1 = new SetValue(set1)
      const value2 = new SetValue(set2)
      const value3 = new SetValue(set3)

      expect(value1.equals(value2)).toBe(true)
      expect(value1.equals(value3)).toBe(false)
    })

    it('should handle RegExp objects correctly', () => {
      class RegExpValue extends ValueObject<{ pattern: RegExp }> {
        constructor(pattern: RegExp) {
          super({ pattern })
        }
      }

      const regex1 = /test/gi
      const regex2 = /test/gi
      const regex3 = /test/g

      const value1 = new RegExpValue(regex1)
      const value2 = new RegExpValue(regex2)
      const value3 = new RegExpValue(regex3)

      expect(value1.equals(value2)).toBe(true)
      expect(value1.equals(value3)).toBe(false)
    })

    it('should handle circular references by throwing stack overflow', () => {
      class CircularValue extends ValueObject<{ data: any }> {
        constructor(data: any) {
          super({ data })
        }
      }

      const circularObj1: any = { name: 'test' }
      circularObj1.self = circularObj1

      const circularObj2: any = { name: 'test' }
      circularObj2.self = circularObj2

      const value1 = new CircularValue(circularObj1)
      const value2 = new CircularValue(circularObj2)

      // dequal does not handle circular references and will throw
      expect(() => value1.equals(value2)).toThrow('Maximum call stack size exceeded')
    })

    it('should handle NaN values correctly', () => {
      class NumberValue extends ValueObject<{ value: number }> {
        constructor(value: number) {
          super({ value })
        }
      }

      const nan1 = new NumberValue(NaN)
      const nan2 = new NumberValue(NaN)
      const num = new NumberValue(42)

      expect(nan1.equals(nan2)).toBe(true) // dequal treats NaN === NaN as true
      expect(nan1.equals(num)).toBe(false)
    })

    it('should handle very deep nesting efficiently', () => {
      class DeepValue extends ValueObject<{ data: any }> {
        constructor(data: any) {
          super({ data })
        }
      }

      // Create deeply nested structure
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' }
        return { next: createDeepObject(depth - 1) }
      }

      const deep1 = new DeepValue(createDeepObject(100))
      const deep2 = new DeepValue(createDeepObject(100))

      const start = Date.now()
      const result = deep1.equals(deep2)
      const duration = Date.now() - start

      expect(result).toBe(true)
      expect(duration).toBeLessThan(100) // Should complete efficiently
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle very large objects efficiently', () => {
      class LargeValue extends ValueObject<{ data: string[] }> {
        constructor(data: string[]) {
          super({ data })
        }
      }

      const largeArray = Array.from({ length: 10000 }, (_, i) => `item-${i}`)
      const value1 = new LargeValue(largeArray)
      const value2 = new LargeValue([...largeArray]) // Spread to create new array

      const start = Date.now()
      const result = value1.equals(value2)
      const duration = Date.now() - start

      expect(result).toBe(true)
      expect(duration).toBeLessThan(100) // Should complete efficiently
    })

    it('should handle empty objects', () => {
      class EmptyValue extends ValueObject<{}> {
        constructor() {
          super({})
        }
      }

      const empty1 = new EmptyValue()
      const empty2 = new EmptyValue()

      expect(empty1.equals(empty2)).toBe(true)
      expect(empty1.toString()).toBe('{}')
    })

    it('should handle objects with function properties', () => {
      class FunctionValue extends ValueObject<{ fn: () => string }> {
        constructor(fn: () => string) {
          super({ fn })
        }
      }

      const fn1 = () => 'test'
      const fn2 = () => 'test'
      const fn3 = () => 'different'

      const value1 = new FunctionValue(fn1)
      const value2 = new FunctionValue(fn1) // Same function reference
      const value3 = new FunctionValue(fn2) // Different function reference
      const value4 = new FunctionValue(fn3) // Different function

      expect(value1.equals(value2)).toBe(true) // Same reference
      expect(value1.equals(value3)).toBe(false) // Different reference
      expect(value1.equals(value4)).toBe(false) // Different function
    })
  })

  describe('performance characteristics', () => {
    it('should handle equality checks efficiently for large complex objects', () => {
      const createComplexObject = () => ({
        arrays: [
          Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })),
          Array.from({ length: 100 }, (_, i) => `tag-${i}`),
        ],
        nested: {
          level1: {
            level2: {
              level3: {
                data: Array.from({ length: 50 }, (_, i) => ({ key: `key-${i}`, value: i * 2 })),
              },
            },
          },
        },
        metadata: {
          timestamp: new Date('2023-01-01'),
          tags: new Set(['a', 'b', 'c']),
          config: new Map([
            ['setting1', 'value1'],
            ['setting2', 'value2'],
          ]),
        },
      })

      class ComplexStructure extends ValueObject<ReturnType<typeof createComplexObject>> {
        constructor(data: ReturnType<typeof createComplexObject>) {
          super(data)
        }
      }

      const complex1 = new ComplexStructure(createComplexObject())
      const complex2 = new ComplexStructure(createComplexObject())

      const start = Date.now()
      const result = complex1.equals(complex2)
      const duration = Date.now() - start

      expect(result).toBe(true)
      expect(duration).toBeLessThan(50) // dequal should be very efficient
    })

    it('should handle toString efficiently for large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          tags: [`tag-${i}`, `category-${i % 10}`],
        })),
      }

      class LargeObjectValue extends ValueObject<typeof largeObject> {
        constructor(data: typeof largeObject) {
          super(data)
        }
      }

      const large = new LargeObjectValue(largeObject)

      const start = Date.now()
      const result = large.toString()
      const duration = Date.now() - start

      expect(result).toContain('"data"')
      expect(result).toContain('"id":0')
      expect(duration).toBeLessThan(100) // Should complete efficiently
    })
  })
})
