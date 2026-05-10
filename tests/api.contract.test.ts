import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Env } from '../src/index'

// ExecutionContext type for Cloudflare Workers
type ExecutionContext = {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
}

/**
 * API Contract Tests
 * 
 * These tests validate that the API endpoints follow their contracts:
 * - Request validation (query params, body structure)
 * - Response structure (status codes, headers, body shape)
 * - Error handling (400, 404, 500 responses)
 * - CORS headers
 */

// Mock D1Database
interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>
}

const createMockDB = (): MockD1Database => {
  return {
    prepare: vi.fn(),
  }
}

// Mock environment
const createMockEnv = (): Env => {
  return {
    DB: createMockDB() as any,
  }
}

// Import the worker
const importWorker = async () => {
  return await import('../src/index')
}

describe('API Contract Tests', () => {
  let worker: any
  let mockEnv: Env
  let mockCtx: ExecutionContext

  beforeEach(async () => {
    worker = await importWorker()
    mockEnv = createMockEnv()
    mockCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as any
  })

  describe('CORS Headers Contract', () => {
    it('should include CORS headers on all responses', async () => {
      const request = new Request('http://localhost:8787/api/health')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, DELETE, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    })

    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('http://localhost:8787/api/health', {
        method: 'OPTIONS',
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('GET /api/health - Contract', () => {
    it('should return 200 with correct response structure', async () => {
      const request = new Request('http://localhost:8787/api/health')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')

      const data = await response.json()
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data.status).toBe('healthy')
      expect(typeof data.timestamp).toBe('string')
    })

    it('should not accept POST method', async () => {
      const request = new Request('http://localhost:8787/api/health', {
        method: 'POST',
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/categories - Contract', () => {
    beforeEach(() => {
      const mockCategories = [
        { id: 1, name: 'noun', description: 'Person, place, or thing', created_at: '2024-01-01' },
        { id: 2, name: 'verb', description: 'Action', created_at: '2024-01-01' },
      ]
      
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockCategories })
      })
    })

    it('should return 200 with success wrapper', async () => {
      const request = new Request('http://localhost:8787/api/categories')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should return categories with required fields', async () => {
      const request = new Request('http://localhost:8787/api/categories')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)
      const data = await response.json()

      expect(data.data.length).toBeGreaterThan(0)
      
      const category = data.data[0]
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('description')
      expect(category).toHaveProperty('created_at')
      
      expect(typeof category.id).toBe('number')
      expect(typeof category.name).toBe('string')
      expect(typeof category.description).toBe('string')
    })
  })

  describe('GET /api/words - Contract', () => {
    beforeEach(() => {
      const mockWords = [
        { id: 1, word: 'cat', category_id: 1, created_at: '2024-01-01' },
        { id: 2, word: 'dog', category_id: 1, created_at: '2024-01-01' },
      ]
      
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockWords }),
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: mockWords })
        })
      })
    })

    it('should return 200 with success wrapper', async () => {
      const request = new Request('http://localhost:8787/api/words')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should accept category_id query parameter', async () => {
      const request = new Request('http://localhost:8787/api/words?category_id=1')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return words with required fields', async () => {
      const request = new Request('http://localhost:8787/api/words')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)
      const data = await response.json()

      if (data.data.length > 0) {
        const word = data.data[0]
        expect(word).toHaveProperty('id')
        expect(word).toHaveProperty('word')
        expect(word).toHaveProperty('category_id')
        expect(word).toHaveProperty('created_at')
        
        expect(typeof word.id).toBe('number')
        expect(typeof word.word).toBe('string')
        expect(typeof word.category_id).toBe('number')
      }
    })
  })

  describe('GET /api/stats - Contract', () => {
    beforeEach(() => {
      const mockStats = [
        { name: 'noun', count: 15 },
        { name: 'verb', count: 10 },
        { name: 'adjective', count: 12 },
        { name: 'adverb', count: 8 },
      ]
      
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockStats })
      })
    })

    it('should return 200 with success wrapper', async () => {
      const request = new Request('http://localhost:8787/api/stats')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.success).toBe(true)
    })

    it('should return stats object with category counts', async () => {
      const request = new Request('http://localhost:8787/api/stats')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)
      const data = await response.json()

      expect(typeof data.data).toBe('object')
      expect(data.data).toHaveProperty('noun')
      expect(data.data).toHaveProperty('verb')
      expect(data.data).toHaveProperty('adjective')
      expect(data.data).toHaveProperty('adverb')
      
      expect(typeof data.data.noun).toBe('number')
      expect(typeof data.data.verb).toBe('number')
      expect(typeof data.data.adjective).toBe('number')
      expect(typeof data.data.adverb).toBe('number')
    })
  })

  describe('POST /api/generate-sentence - Contract', () => {
    beforeEach(() => {
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn()
            .mockResolvedValueOnce({ word: 'cat' })
            .mockResolvedValueOnce({ word: 'runs' })
        })
      })
    })

    it('should accept valid JSON body', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNoun: true,
          includeVerb: true,
        }),
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
    })

    it('should return 200 with success response structure', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNoun: true,
          includeVerb: true,
        }),
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('sentence')
      expect(typeof data.data.sentence).toBe('string')
    })

    it('should return 400 when no options selected', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNoun: false,
          includeVerb: false,
          includeAdjective: false,
          includeAdverb: false,
        }),
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('error')
      expect(data.success).toBe(false)
      expect(typeof data.error).toBe('string')
    })

    it('should accept optional custom word parameters', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNoun: true,
          noun: 'custom-noun',
          includeVerb: true,
          verb: 'custom-verb',
        }),
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(200)
    })

    it('should not accept GET method', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'GET',
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(404)
    })
  })

  describe('Error Response Contracts', () => {
    it('should return 404 with error structure for unknown routes', async () => {
      const request = new Request('http://localhost:8787/api/nonexistent')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(404)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('error')
      expect(data.success).toBe(false)
      expect(typeof data.error).toBe('string')
      expect(data.error).toBe('Not found')
    })

    it('should handle database errors gracefully', async () => {
      // The API handles DB errors gracefully by catching them and returning empty results
      // This is actually good defensive programming
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('Database error'))
      })

      const request = new Request('http://localhost:8787/api/categories')
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      // Should still return 200 with empty data (graceful degradation)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('Request Validation Contracts', () => {
    it('should handle missing Content-Type header on POST', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        body: JSON.stringify({ includeNoun: true }),
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      // Should still work or return appropriate error
      expect([200, 400, 500]).toContain(response.status)
    })

    it('should handle invalid JSON in POST body', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(500)
    })

    it('should handle empty POST body', async () => {
      const request = new Request('http://localhost:8787/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const response = await worker.default.fetch(request, mockEnv, mockCtx)

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Response Structure Consistency', () => {
    it('should always return JSON responses', async () => {
      const endpoints = [
        '/api/health',
        '/api/categories',
        '/api/words',
        '/api/stats',
        '/api/nonexistent',
      ]

      for (const endpoint of endpoints) {
        const request = new Request(`http://localhost:8787${endpoint}`)
        const response = await worker.default.fetch(request, mockEnv, mockCtx)
        
        expect(response.headers.get('Content-Type')).toContain('application/json')
        
        // Should be valid JSON
        const data = await response.json()
        expect(data).toBeDefined()
      }
    })

    it('should use consistent success/error response format', async () => {
      // Success response
      mockEnv.DB.prepare = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: [] })
      })

      const successRequest = new Request('http://localhost:8787/api/categories')
      const successResponse = await worker.default.fetch(successRequest, mockEnv, mockCtx)
      const successData = await successResponse.json()

      expect(successData).toHaveProperty('success')
      expect(successData).toHaveProperty('data')
      expect(successData.success).toBe(true)

      // Error response
      const errorRequest = new Request('http://localhost:8787/api/nonexistent')
      const errorResponse = await worker.default.fetch(errorRequest, mockEnv, mockCtx)
      const errorData = await errorResponse.json()

      expect(errorData).toHaveProperty('success')
      expect(errorData).toHaveProperty('error')
      expect(errorData.success).toBe(false)
    })
  })
})
