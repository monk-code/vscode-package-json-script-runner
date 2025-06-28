export type CachedSearchData = {
  lowercased: string
  words: string[]
}

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export const createDebounced = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): DebouncedFunction<T> => {
  let timeoutId: NodeJS.Timeout | undefined

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = undefined
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}

export class SearchCache {
  private cache = new Map<
    string,
    CachedSearchData & { size: number; lastAccessed: number }
  >()
  private totalSize = 0
  private readonly maxSize: number

  constructor(maxSizeBytes: number) {
    this.maxSize = maxSizeBytes
  }

  get(key: string): CachedSearchData | undefined {
    const entry = this.cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      return {
        lowercased: entry.lowercased,
        words: entry.words,
      }
    }
    return undefined
  }

  set(key: string, data: CachedSearchData): void {
    // Estimate size: 2 bytes per character for strings, 8 bytes per array element
    const size =
      (key.length + data.lowercased.length) * 2 +
      data.words.length * 8 +
      data.words.reduce((sum, word) => sum + word.length * 2, 0)

    const existing = this.cache.get(key)
    if (existing) {
      this.totalSize -= existing.size
    }

    this.cache.set(key, {
      ...data,
      size,
      lastAccessed: Date.now(),
    })
    this.totalSize += size

    this.evictIfNeeded()
  }

  getOrCompute(
    key: string,
    computeFn: () => CachedSearchData
  ): CachedSearchData {
    const cached = this.get(key)
    if (cached) {
      return cached
    }

    const computed = computeFn()
    this.set(key, computed)
    return computed
  }

  clear(): void {
    this.cache.clear()
    this.totalSize = 0
  }

  getSize(): number {
    return this.totalSize
  }

  private evictIfNeeded(): void {
    while (this.totalSize > this.maxSize && this.cache.size > 0) {
      let lruKey: string | undefined
      let lruTime = Infinity

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed
          lruKey = key
        }
      }

      if (lruKey) {
        const entry = this.cache.get(lruKey)
        if (entry) {
          this.cache.delete(lruKey)
          this.totalSize -= entry.size
        }
      }
    }
  }
}
