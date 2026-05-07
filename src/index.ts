import { SentenceFactory, SentenceOptions } from './SentenceFactory';

export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Initialize SentenceFactory
		const factory = new SentenceFactory(env.DB);

		try {
			// Health check endpoint
			if (path === '/api/health' && request.method === 'GET') {
				return Response.json(
					{ status: 'healthy', timestamp: new Date().toISOString() },
					{ headers: corsHeaders }
				);
			}

			// Get all categories
			if (path === '/api/categories' && request.method === 'GET') {
				const categories = await factory.getCategories();
				return Response.json(
					{ success: true, data: categories },
					{ headers: corsHeaders }
				);
			}

			// Get words (optionally filtered by category)
			if (path === '/api/words' && request.method === 'GET') {
				const categoryId = url.searchParams.get('category_id');
				const words = await factory.getWords(categoryId ? parseInt(categoryId) : undefined);
				return Response.json(
					{ success: true, data: words },
					{ headers: corsHeaders }
				);
			}

			// Get word count statistics
			if (path === '/api/stats' && request.method === 'GET') {
				const stats = await factory.getWordCountByCategory();
				return Response.json(
					{ success: true, data: stats },
					{ headers: corsHeaders }
				);
			}

			// Generate sentence
			if (path === '/api/generate-sentence' && request.method === 'POST') {
				const options: SentenceOptions = await request.json();

				// Validate options
				if (!SentenceFactory.validateOptions(options)) {
					return Response.json(
						{ success: false, error: 'At least one part of speech must be selected' },
						{ status: 400, headers: corsHeaders }
					);
				}

				const sentence = await factory.generate(options);
				
				if (!sentence) {
					return Response.json(
						{ success: false, error: 'Unable to generate sentence. Database may be empty.' },
						{ status: 400, headers: corsHeaders }
					);
				}

				return Response.json(
					{ success: true, data: { sentence } },
					{ headers: corsHeaders }
				);
			}

			// 404 for unknown routes
			return Response.json(
				{ success: false, error: 'Not found' },
				{ status: 404, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Error:', error);
			return Response.json(
				{ success: false, error: 'Internal server error' },
				{ status: 500, headers: corsHeaders }
			);
		}
	},
};
