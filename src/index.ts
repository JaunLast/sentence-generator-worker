import { SentenceFactory, SentenceOptions } from './SentenceFactory';
import { AuthService } from './AuthService';
import { HistoryService } from './HistoryService';

export interface Env {
	DB: D1Database;
	AI: any;
	JWT_SECRET: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
}

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: any, status = 200) => 
	Response.json(data, { status, headers: CORS_HEADERS });

const getUserFromToken = async (request: Request, authService: AuthService) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader?.startsWith('Bearer ')) return null;
	const token = authHeader.substring(7);
	const payload = await authService.verifyToken(token);
	if (!payload) return null;
	return await authService.getUserById(payload.userId);
};

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: CORS_HEADERS });
		}

		if (path === '/') {
			return jsonResponse({ 
				success: true, 
				message: 'Sentence Generator API',
				version: '1.0.0',
				endpoints: {
					auth: '/api/auth/*',
					sentences: '/api/sentences',
					history: '/api/history/*'
				}
			});
		}

		const factory = new SentenceFactory(env.DB);
		const authService = new AuthService(env.DB, env.JWT_SECRET);
		const historyService = new HistoryService(env.DB);

		try {
			if (path === '/api/health' && request.method === 'GET') {
				return jsonResponse({ status: 'healthy', timestamp: new Date().toISOString() });
			}

			if (path === '/api/categories' && request.method === 'GET') {
				return jsonResponse({ success: true, data: await factory.getCategories() });
			}

			if (path === '/api/words' && request.method === 'GET') {
				const categoryId = url.searchParams.get('category_id');
				return jsonResponse({ success: true, data: await factory.getWords(categoryId ? parseInt(categoryId) : undefined) });
			}

			if (path.startsWith('/api/words/') && request.method === 'GET') {
				return jsonResponse({ success: true, data: await factory.getWordsByCategory(path.split('/').pop() || '') });
			}

			if (path === '/api/stats' && request.method === 'GET') {
				return jsonResponse({ success: true, data: await factory.getWordCountByCategory() });
			}

			if (path === '/api/generate/ai' && request.method === 'POST') {
				try {
					const body = await request.json() as { prompt?: string; style?: string; length?: string };
					const prompt = body.prompt || 'Generate a creative and interesting sentence';
					const style = body.style || 'creative';
					const length = body.length || 'medium';
					const aiPrompt = `Generate a single ${length} ${style} sentence. ${prompt}. Only respond with the sentence itself, no explanations or additional text.`;
					
					const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
						messages: [
							{ role: 'system', content: 'You are a creative sentence generator. Generate only the requested sentence with no additional text or explanations.' },
							{ role: 'user', content: aiPrompt }
						],
						max_tokens: 100,
						temperature: 0.8
					});
					
					const sentence = response.response?.trim() || 'Failed to generate sentence';
					const user = await getUserFromToken(request, authService);
					if (user) {
						await historyService.saveSentence(user.id, sentence);
					}
					
					return jsonResponse({ success: true, data: { sentence, method: 'ai' } });
				} catch (error) {
					console.error('AI generation error:', error);
					return jsonResponse({ success: false, error: 'AI sentence generation failed' }, 500);
				}
			}

			if (path === '/api/auth/signup' && request.method === 'POST') {
				const { email, password, name } = await request.json() as { email: string; password: string; name?: string };
				if (!email || !password) {
					return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
				}
				try {
					const result = await authService.signup(email, password, name);
					return jsonResponse({ success: true, data: result });
				} catch (error) {
					return jsonResponse({ success: false, error: error instanceof Error ? error.message : 'Signup failed' }, 400);
				}
			}

			if (path === '/api/auth/login' && request.method === 'POST') {
				const { email, password } = await request.json() as { email: string; password: string };
				if (!email || !password) {
					return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
				}
				try {
					const result = await authService.login(email, password);
					return jsonResponse({ success: true, data: result });
				} catch (error) {
					return jsonResponse({ success: false, error: error instanceof Error ? error.message : 'Login failed' }, 401);
				}
			}

			if (path === '/api/auth/me' && request.method === 'GET') {
				const user = await getUserFromToken(request, authService);
				if (!user) {
					return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
				}
				return jsonResponse({ success: true, data: user });
			}

			if (path === '/api/auth/logout' && request.method === 'POST') {
				return jsonResponse({ success: true });
			}

			if (path === '/api/auth/google' && request.method === 'GET') {
				const clientId = env.GOOGLE_CLIENT_ID || '';
				if (!clientId) {
					return jsonResponse({ success: false, error: 'Google OAuth not configured' }, 501);
				}
				const redirectUri = `${url.origin}/auth/google/callback`;
				const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
					`client_id=${clientId}&` +
					`redirect_uri=${encodeURIComponent(redirectUri)}&` +
					`response_type=code&` +
					`scope=${encodeURIComponent('openid email profile')}&` +
					`access_type=offline&` +
					`prompt=consent`;
				return Response.redirect(googleAuthUrl, 302);
			}

			if (path === '/api/auth/github' && request.method === 'GET') {
				const clientId = env.GITHUB_CLIENT_ID || '';
				if (!clientId) {
					return jsonResponse({ success: false, error: 'GitHub OAuth not configured' }, 501);
				}
				const backendOrigin = url.origin.replace('localhost', '127.0.0.1');
				const redirectUri = `${backendOrigin}/api/auth/github/callback`;
				const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
					`client_id=${clientId}&` +
					`redirect_uri=${encodeURIComponent(redirectUri)}&` +
					`scope=${encodeURIComponent('read:user user:email')}`;
				return Response.redirect(githubAuthUrl, 302);
			}

			if (path === '/auth/google/callback' && request.method === 'GET') {
				const code = url.searchParams.get('code');
				if (!code) {
					return new Response('OAuth error: No code provided', { status: 400 });
				}
				
				try {
					const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
						body: new URLSearchParams({
							code,
							client_id: env.GOOGLE_CLIENT_ID || '',
							client_secret: env.GOOGLE_CLIENT_SECRET || '',
							redirect_uri: `${url.origin}/auth/google/callback`,
							grant_type: 'authorization_code',
						}),
					});
					
					const tokens = await tokenResponse.json() as any;
					if (!tokens.access_token) {
						console.error('Token exchange failed:', tokens);
						return new Response('OAuth error: Failed to get access token', { status: 500 });
					}
					
					const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
						headers: { Authorization: `Bearer ${tokens.access_token}` },
					});
					
					const userInfo = await userInfoResponse.json() as any;
					console.log('Google userInfo:', userInfo);
					
					if (!userInfo.email) {
						console.error('No email in userInfo:', userInfo);
						return new Response('OAuth error: No email provided by Google', { status: 400 });
					}
					
					let user = await authService.getUserByEmail(userInfo.email);
					if (!user) {
						const userId = crypto.randomUUID();
						await env.DB.prepare(
							'INSERT INTO Users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
						).bind(userId, userInfo.email, 'oauth-google', userInfo.name).run();
						user = { id: userId, email: userInfo.email, name: userInfo.name, provider: 'google' };
					}
					
					if (!user) {
						throw new Error('Failed to create or retrieve user');
					}
					
					const token = await authService.generateToken(user.id);
					const frontendUrl = request.headers.get('origin') || 'http://localhost:3000';
					return Response.redirect(`${frontendUrl}?token=${token}`, 302);
				} catch (error) {
					console.error('Google OAuth error:', error);
					return new Response('OAuth authentication failed', { status: 500 });
				}
			}

			if (path === '/api/auth/github/callback' && request.method === 'GET') {
				const code = url.searchParams.get('code');
				if (!code) {
					return new Response('OAuth error: No code provided', { status: 400 });
				}
				
				try {
					const backendOrigin = url.origin.replace('localhost', '127.0.0.1');
					const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Accept': 'application/json',
						},
						body: JSON.stringify({
							client_id: env.GITHUB_CLIENT_ID || '',
							client_secret: env.GITHUB_CLIENT_SECRET || '',
							code,
							redirect_uri: `${backendOrigin}/api/auth/github/callback`,
						}),
					});
					
					const tokens = await tokenResponse.json() as any;
					
					const userInfoResponse = await fetch('https://api.github.com/user', {
						headers: {
							Authorization: `Bearer ${tokens.access_token}`,
							'User-Agent': 'Sentence-Generator-App',
						},
					});
					
					const userInfo = await userInfoResponse.json() as any;
					
					const emailResponse = await fetch('https://api.github.com/user/emails', {
						headers: {
							Authorization: `Bearer ${tokens.access_token}`,
							'User-Agent': 'Sentence-Generator-App',
						},
					});
					
					const emails = await emailResponse.json() as any[];
					const primaryEmail = emails.find(e => e.primary)?.email || userInfo.email;
					
					let user = await authService.getUserByEmail(primaryEmail);
					if (!user) {
						const userId = crypto.randomUUID();
						await env.DB.prepare(
							'INSERT INTO Users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
						).bind(userId, primaryEmail, 'oauth-github', userInfo.name || userInfo.login).run();
						user = { id: userId, email: primaryEmail, name: userInfo.name || userInfo.login, provider: 'github' };
					}
					
					if (!user) {
						throw new Error('Failed to create or retrieve user');
					}
					
					const token = await authService.generateToken(user.id);
					const frontendUrl = request.headers.get('origin') || 'http://localhost:3000';
					return Response.redirect(`${frontendUrl}?token=${token}`, 302);
				} catch (error) {
					console.error('GitHub OAuth error:', error);
					return new Response('OAuth authentication failed', { status: 500 });
				}
			}

			if (path === '/api/history' && request.method === 'GET') {
				const user = await getUserFromToken(request, authService);
				if (!user) {
					return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
				}
				const history = await historyService.getHistory(user.id);
				return jsonResponse({ success: true, data: { history } });
			}

			if (path === '/api/history' && request.method === 'DELETE') {
				const user = await getUserFromToken(request, authService);
				if (!user) {
					return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
				}
				await historyService.clearHistory(user.id);
				return jsonResponse({ success: true });
			}

			if (path.match(/^\/api\/history\/[^/]+$/) && request.method === 'DELETE') {
				const user = await getUserFromToken(request, authService);
				if (!user) {
					return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
				}
				const historyId = path.split('/').pop()!;
				await historyService.deleteHistory(user.id, historyId);
				return jsonResponse({ success: true });
			}

			if (path === '/api/generate-sentence' && request.method === 'POST') {
				try {
					const options: SentenceOptions = await request.json();
					const parts: string[] = [];
					if (options.includeNoun) parts.push('a noun');
					if (options.includeVerb) parts.push('a verb');
					if (options.includeAdjective) parts.push('an adjective');
					if (options.includeAdverb) parts.push('an adverb');

					let aiPrompt = 'Generate a creative and interesting sentence';
					if (parts.length > 0) {
						aiPrompt += ` that includes ${parts.join(', ')}`;
					}
					
					const specificWords: string[] = [];
					if (options.noun) specificWords.push(`the noun "${options.noun}"`);
					if (options.verb) specificWords.push(`the verb "${options.verb}"`);
					if (options.adjective) specificWords.push(`the adjective "${options.adjective}"`);
					if (options.adverb) specificWords.push(`the adverb "${options.adverb}"`);
					
					if (specificWords.length > 0) {
						aiPrompt += ` using ${specificWords.join(', ')}`;
					}
					
					aiPrompt += '. Only respond with the sentence itself, no explanations or additional text.';

					const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
						messages: [
							{ role: 'system', content: 'You are a creative sentence generator. Generate only the requested sentence with no additional text or explanations.' },
							{ role: 'user', content: aiPrompt }
						],
						max_tokens: 100,
						temperature: 0.8
					});

					const sentence = response.response?.trim() || 'Failed to generate sentence';
					const user = await getUserFromToken(request, authService);
					if (user) {
						await historyService.createHistory(user.id, sentence, {
							includeNoun: options.includeNoun,
							includeVerb: options.includeVerb,
							includeAdjective: options.includeAdjective,
							includeAdverb: options.includeAdverb,
						});
					}

					return jsonResponse({ success: true, data: { sentence, method: 'ai' } });
				} catch (error) {
					console.error('AI generation error:', error);
					return jsonResponse({ success: false, error: 'AI sentence generation failed' }, 500);
				}
			}

			return jsonResponse({ success: false, error: 'Not found' }, 404);
		} catch (error) {
			console.error('Error:', error);
			return jsonResponse({ success: false, error: 'Internal server error' }, 500);
		}
	},
};
