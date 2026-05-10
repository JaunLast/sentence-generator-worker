import { SentenceFactory, SentenceOptions } from './SentenceFactory';
import { AuthService } from './AuthService';
import { HistoryService } from './HistoryService';

export interface Env {
	DB: D1Database;
	JWT_SECRET: string;
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Default route for root path
		if (path === '/') {
			return Response.json(
				{ 
					success: true, 
					message: 'Sentence Generator API',
					version: '1.0.0',
					endpoints: {
						auth: '/api/auth/*',
						sentences: '/api/sentences',
						history: '/api/history/*'
					}
				},
				{ headers: corsHeaders }
			);
		}

		// Initialize services
		const factory = new SentenceFactory(env.DB);
		const authService = new AuthService(env.DB, env.JWT_SECRET);
		const historyService = new HistoryService(env.DB);

		// Helper to get user from token
		const getUserFromToken = async (request: Request) => {
			const authHeader = request.headers.get('Authorization');
			if (!authHeader?.startsWith('Bearer ')) {
				return null;
			}
			const token = authHeader.substring(7);
			const payload = await authService.verifyToken(token);
			if (!payload) {
				return null;
			}
			return await authService.getUserById(payload.userId);
		};

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

			// Get words by category name (nouns, verbs, adjectives, adverbs)
			if (path.startsWith('/api/words/') && request.method === 'GET') {
				const categoryName = path.split('/').pop();
				const words = await factory.getWordsByCategory(categoryName || '');
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

			// Auth endpoints
			if (path === '/api/auth/signup' && request.method === 'POST') {
				const { email, password, name } = await request.json() as { email: string; password: string; name?: string };
				if (!email || !password) {
					return Response.json(
						{ success: false, error: 'Email and password are required' },
						{ status: 400, headers: corsHeaders }
					);
				}
				try {
					const result = await authService.signup(email, password, name);
					return Response.json(
						{ success: true, data: result },
						{ headers: corsHeaders }
					);
				} catch (error) {
					return Response.json(
						{ success: false, error: error instanceof Error ? error.message : 'Signup failed' },
						{ status: 400, headers: corsHeaders }
					);
				}
			}

			if (path === '/api/auth/login' && request.method === 'POST') {
				const { email, password } = await request.json() as { email: string; password: string };
				if (!email || !password) {
					return Response.json(
						{ success: false, error: 'Email and password are required' },
						{ status: 400, headers: corsHeaders }
					);
				}
				try {
					const result = await authService.login(email, password);
					return Response.json(
						{ success: true, data: result },
						{ headers: corsHeaders }
					);
				} catch (error) {
					return Response.json(
						{ success: false, error: error instanceof Error ? error.message : 'Login failed' },
						{ status: 401, headers: corsHeaders }
					);
				}
			}

			if (path === '/api/auth/me' && request.method === 'GET') {
				const user = await getUserFromToken(request);
				if (!user) {
					return Response.json(
						{ success: false, error: 'Unauthorized' },
						{ status: 401, headers: corsHeaders }
					);
				}
				return Response.json(
					{ success: true, data: user },
					{ headers: corsHeaders }
				);
			}

			if (path === '/api/auth/logout' && request.method === 'POST') {
				return Response.json(
					{ success: true },
					{ headers: corsHeaders }
				);
			}

			// History endpoints
			if (path === '/api/history' && request.method === 'GET') {
				const user = await getUserFromToken(request);
				if (!user) {
					return Response.json(
						{ success: false, error: 'Unauthorized' },
						{ status: 401, headers: corsHeaders }
					);
				}
				const history = await historyService.getHistory(user.id);
				return Response.json(
					{ success: true, data: { history } },
					{ headers: corsHeaders }
				);
			}

			if (path === '/api/history' && request.method === 'DELETE') {
				const user = await getUserFromToken(request);
				if (!user) {
					return Response.json(
						{ success: false, error: 'Unauthorized' },
						{ status: 401, headers: corsHeaders }
					);
				}
				await historyService.clearHistory(user.id);
				return Response.json(
					{ success: true },
					{ headers: corsHeaders }
				);
			}

			if (path.match(/^\/api\/history\/[^/]+$/) && request.method === 'DELETE') {
				const user = await getUserFromToken(request);
				if (!user) {
					return Response.json(
						{ success: false, error: 'Unauthorized' },
						{ status: 401, headers: corsHeaders }
					);
				}
				const historyId = path.split('/').pop()!;
				await historyService.deleteHistory(user.id, historyId);
				return Response.json(
					{ success: true },
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

				// Save to history if user is authenticated
				const user = await getUserFromToken(request);
				if (user) {
					await historyService.createHistory(user.id, sentence, {
						includeNoun: options.includeNoun,
						includeVerb: options.includeVerb,
						includeAdjective: options.includeAdjective,
						includeAdverb: options.includeAdverb,
					});
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
