import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SentenceFactory, SentenceOptions } from '../src/SentenceFactory'

// Mock D1Database type
interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>
}

const createMockDB = (): MockD1Database => {
  return {
    prepare: vi.fn(),
  }
}

describe('SentenceFactory', () => {
  let mockDB: MockD1Database
  let factory: SentenceFactory

  beforeEach(() => {
    mockDB = createMockDB()
    factory = new SentenceFactory(mockDB as any)
  })

  describe('Happy Path Tests', () => {
    describe('generate()', () => {
      it('should generate sentence with noun and verb', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn()
              .mockResolvedValueOnce({ word: 'cat' })  // noun
              .mockResolvedValueOnce({ word: 'runs' }) // verb
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
          includeVerb: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBe('The cat runs.')
        expect(mockPrepare).toHaveBeenCalledTimes(2)
      })

      it('should generate sentence with all parts of speech', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn()
              .mockResolvedValueOnce({ word: 'happy' })    // adjective
              .mockResolvedValueOnce({ word: 'cat' })      // noun
              .mockResolvedValueOnce({ word: 'runs' })     // verb
              .mockResolvedValueOnce({ word: 'quickly' })  // adverb
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
          includeVerb: true,
          includeAdjective: true,
          includeAdverb: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBe('The happy cat runs quickly.')
        expect(mockPrepare).toHaveBeenCalledTimes(4)
      })

      it('should generate sentence with only adjective', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValueOnce({ word: 'beautiful' })
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeAdjective: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBe('The beautiful.')
      })

      it('should capitalize first letter of sentence', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValueOnce({ word: 'dog' })
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBe('The dog.')
        expect(result?.charAt(0)).toBe('T')
      })

      it('should add period at end of sentence', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValueOnce({ word: 'cat' })
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
        }

        const result = await factory.generate(options)
        
        expect(result?.endsWith('.')).toBe(true)
      })
    })

    describe('getCategories()', () => {
      it('should return all categories', async () => {
        const mockCategories = [
          { id: 1, name: 'noun', description: 'Person, place, or thing' },
          { id: 2, name: 'verb', description: 'Action or state of being' },
          { id: 3, name: 'adjective', description: 'Describes a noun' },
          { id: 4, name: 'adverb', description: 'Describes a verb or adjective' },
        ]

        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: mockCategories })
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getCategories()
        
        expect(result).toEqual(mockCategories)
        expect(result).toHaveLength(4)
      })
    })

    describe('getWords()', () => {
      it('should return all words when no category specified', async () => {
        const mockWords = [
          { id: 1, word: 'cat', category_id: 1 },
          { id: 2, word: 'run', category_id: 2 },
        ]

        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: mockWords })
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWords()
        
        expect(result).toEqual(mockWords)
      })

      it('should return filtered words by category', async () => {
        const mockNouns = [
          { id: 1, word: 'cat', category_id: 1 },
          { id: 2, word: 'dog', category_id: 1 },
        ]

        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: mockNouns })
          })
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWords(1)
        
        expect(result).toEqual(mockNouns)
        expect(result.every(w => w.category_id === 1)).toBe(true)
      })
    })

    describe('getWordCountByCategory()', () => {
      it('should return word counts for all categories', async () => {
        const mockStats = [
          { name: 'noun', count: 15 },
          { name: 'verb', count: 15 },
          { name: 'adjective', count: 15 },
          { name: 'adverb', count: 15 },
        ]

        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: mockStats })
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWordCountByCategory()
        
        expect(result).toEqual({
          noun: 15,
          verb: 15,
          adjective: 15,
          adverb: 15,
        })
      })
    })
  })

  describe('Sad Path Tests', () => {
    describe('generate() - Error Cases', () => {
      it('should return null when no options are selected', async () => {
        const options: SentenceOptions = {}

        const result = await factory.generate(options)
        
        expect(result).toBeNull()
      })

      it('should return null when all options are false', async () => {
        const options: SentenceOptions = {
          includeNoun: false,
          includeVerb: false,
          includeAdjective: false,
          includeAdverb: false,
        }

        const result = await factory.generate(options)
        
        expect(result).toBeNull()
      })

      it('should handle missing word category gracefully', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn()
              .mockResolvedValueOnce(null) // noun not found
              .mockResolvedValueOnce({ word: 'runs' }) // verb found
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
          includeVerb: true,
        }

        const result = await factory.generate(options)
        
        // Should still generate with available words
        expect(result).toBe('The runs.')
      })

      it('should return null when no words found for any category', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null)
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
          includeVerb: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBeNull()
      })

      it('should handle database errors gracefully', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBeNull()
      })

      it('should handle undefined word results', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(undefined)
          })
        })
        mockDB.prepare = mockPrepare

        const options: SentenceOptions = {
          includeNoun: true,
        }

        const result = await factory.generate(options)
        
        expect(result).toBeNull()
      })
    })

    describe('getCategories() - Error Cases', () => {
      it('should return empty array on database error', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockRejectedValue(new Error('Database error'))
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getCategories()
        
        expect(result).toEqual([])
      })
    })

    describe('getWords() - Error Cases', () => {
      it('should return empty array on database error', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockRejectedValue(new Error('Database error'))
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWords()
        
        expect(result).toEqual([])
      })

      it('should handle invalid category ID gracefully', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [] })
          })
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWords(999)
        
        expect(result).toEqual([])
      })
    })

    describe('getWordCountByCategory() - Error Cases', () => {
      it('should return empty object on database error', async () => {
        const mockPrepare = vi.fn().mockReturnValue({
          all: vi.fn().mockRejectedValue(new Error('Database error'))
        })
        mockDB.prepare = mockPrepare

        const result = await factory.getWordCountByCategory()
        
        expect(result).toEqual({})
      })
    })
  })

  describe('Validation Tests', () => {
    describe('validateOptions()', () => {
      it('should return true when at least one option is true', () => {
        expect(SentenceFactory.validateOptions({ includeNoun: true })).toBe(true)
        expect(SentenceFactory.validateOptions({ includeVerb: true })).toBe(true)
        expect(SentenceFactory.validateOptions({ includeAdjective: true })).toBe(true)
        expect(SentenceFactory.validateOptions({ includeAdverb: true })).toBe(true)
      })

      it('should return true when multiple options are true', () => {
        const options: SentenceOptions = {
          includeNoun: true,
          includeVerb: true,
        }
        expect(SentenceFactory.validateOptions(options)).toBe(true)
      })

      it('should return false when no options are true', () => {
        expect(SentenceFactory.validateOptions({})).toBe(false)
      })

      it('should return false when all options are false', () => {
        const options: SentenceOptions = {
          includeNoun: false,
          includeVerb: false,
          includeAdjective: false,
          includeAdverb: false,
        }
        expect(SentenceFactory.validateOptions(options)).toBe(false)
      })

      it('should return false when all options are undefined', () => {
        const options: SentenceOptions = {
          includeNoun: undefined,
          includeVerb: undefined,
          includeAdjective: undefined,
          includeAdverb: undefined,
        }
        expect(SentenceFactory.validateOptions(options)).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string words', async () => {
      const mockPrepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValueOnce({ word: '' })
        })
      })
      mockDB.prepare = mockPrepare

      const options: SentenceOptions = {
        includeNoun: true,
      }

      const result = await factory.generate(options)
      
      // Empty word should be skipped, resulting in null
      expect(result).toBeNull()
    })

    it('should handle very long words', async () => {
      const longWord = 'a'.repeat(1000)
      const mockPrepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValueOnce({ word: longWord })
        })
      })
      mockDB.prepare = mockPrepare

      const options: SentenceOptions = {
        includeNoun: true,
      }

      const result = await factory.generate(options)
      
      expect(result).toBe('The ' + longWord + '.')
    })

    it('should handle special characters in words', async () => {
      const mockPrepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValueOnce({ word: "can't" })
        })
      })
      mockDB.prepare = mockPrepare

      const options: SentenceOptions = {
        includeVerb: true,
      }

      const result = await factory.generate(options)
      
      expect(result).toBe("The can't.")
    })
  })
})
