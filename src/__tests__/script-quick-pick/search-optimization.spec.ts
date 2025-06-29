import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDebounced,
  SearchCache,
} from '#/script-quick-pick/search-optimization.js'

describe('Search Optimization', () => {
  describe('createDebounced', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('should debounce function calls', async () => {
      // Given
      const mockFn = vi.fn()
      const debounced = createDebounced(mockFn, 150)

      // When - rapid calls
      debounced('call1')
      debounced('call2')
      debounced('call3')

      // Then - function not called immediately
      expect(mockFn).not.toHaveBeenCalled()

      // When - wait for debounce
      await vi.runAllTimersAsync()

      // Then - only last call executed
      expect(mockFn).toHaveBeenCalledOnce()
      expect(mockFn).toHaveBeenCalledWith('call3')
    })

    it('should cancel previous timeouts', async () => {
      // Given
      const mockFn = vi.fn()
      const debounced = createDebounced(mockFn, 150)

      // When
      debounced('call1')
      await vi.advanceTimersByTimeAsync(100) // Advance 100ms
      debounced('call2') // Should cancel previous

      await vi.advanceTimersByTimeAsync(100) // Advance another 100ms

      // Then - first call should not execute
      expect(mockFn).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(50) // Complete the 150ms from call2

      // Then - only second call executes
      expect(mockFn).toHaveBeenCalledOnce()
      expect(mockFn).toHaveBeenCalledWith('call2')
    })
  })

  describe('SearchCache', () => {
    it('should cache search results', () => {
      // Given
      const cache = new SearchCache(10 * 1024 * 1024) // 10MB limit
      const testData = { lowercased: 'test data', words: ['test', 'data'] }

      // When
      cache.set('key1', testData)

      // Then
      expect(cache.get('key1')).toEqual(testData)
    })

    it('should return undefined for missing keys', () => {
      // Given
      const cache = new SearchCache(10 * 1024 * 1024)

      // Then
      expect(cache.get('missing')).toBeUndefined()
    })

    it('should track memory usage', () => {
      // Given
      const cache = new SearchCache(1024) // 1KB limit
      const largeData = {
        lowercased: 'a'.repeat(500),
        words: Array(100).fill('word'),
      }

      // When
      cache.set('key1', largeData)
      cache.set('key2', largeData)

      // Then - second item should trigger eviction
      expect(cache.getSize()).toBeLessThan(1024)
    })

    it('should evict least recently used items when limit exceeded', () => {
      // Given
      const cache = new SearchCache(100) // Small limit (each entry is 36 bytes)

      // Create entries that will exceed the limit
      const data1 = { lowercased: 'data1', words: ['data1'] }
      const data2 = { lowercased: 'data2', words: ['data2'] }
      const data3 = { lowercased: 'data3', words: ['data3'] }

      // When
      cache.set('key1', data1) // 36 bytes
      cache.set('key2', data2) // 72 bytes total
      cache.set('key3', data3) // 108 bytes total - should trigger eviction of key1

      // Access key3 to make it more recent than key2
      cache.get('key3')

      // Add another item that should trigger eviction of key2 (least recently used)
      const data4 = { lowercased: 'data4', words: ['data4'] }
      cache.set('key4', data4)

      // Then - key1 and key2 should be evicted
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.get('key3')).toBeDefined()
      expect(cache.get('key4')).toBeDefined()
    })

    it('should clear all entries', () => {
      // Given
      const cache = new SearchCache(10 * 1024 * 1024)
      cache.set('key1', { lowercased: 'test1', words: ['test1'] })
      cache.set('key2', { lowercased: 'test2', words: ['test2'] })

      // When
      cache.clear()

      // Then
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.getSize()).toBe(0)
    })
  })

  describe('Integration with search', () => {
    it('should cache lowercased text and word splits', () => {
      // Given
      const cache = new SearchCache(10 * 1024 * 1024)
      const text = 'Package-Name with MIXED case'

      // When - first call should process and cache
      const result1 = cache.getOrCompute(text, () => {
        const lowercased = text.toLowerCase()
        const words = lowercased.split(/[\s\-_@/:]+/)
        return { lowercased, words }
      })

      // When - second call should use cache
      const computeFn = vi.fn()
      const result2 = cache.getOrCompute(text, computeFn)

      // Then
      expect(result1).toEqual({
        lowercased: 'package-name with mixed case',
        words: ['package', 'name', 'with', 'mixed', 'case'],
      })
      expect(result2).toEqual(result1)
      expect(computeFn).not.toHaveBeenCalled() // Should use cache
    })
  })
})
