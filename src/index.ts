export interface Env {
	DB: D1Database;
}

interface SentenceRequest {
	includeNoun?: boolean;
	includeVerb?: boolean;
	includeAdjective?: boolean;
	includeAdverb?: boolean;
}

interface Word {
	id: number;
	word: string;
	category_id: number;
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

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			if (path === '/api/health' && request.method === 'GET') {
				return Response.json({ status: 'healthy', timestamp: new Date().toISOString() }, { headers: corsHeaders });
			}

			if (path === '/api/categories' && request.method === 'GET') {
				const categories = await env.DB.prepare('SELECT * FROM Categories ORDER BY name').all();
				return Response.json({ success: true, data: categories.results }, { headers: corsHeaders });
			}

			if (path === '/api/words' && request.method === 'GET') {
				const categoryId = url.searchParams.get('category_id');
				let query = 'SELECT * FROM Words';
				
				if (categoryId) {
					query += ' WHERE category_id = ?';
					const words = await env.DB.prepare(query).bind(categoryId).all();
					return Response.json({ success: true, data: words.results }, { headers: corsHeaders });
				}
				
				const words = await env.DB.prepare(query).all();
				return Response.json({ success: true, data: words.results }, { headers: corsHeaders });
			}

			if (path === '/api/generate-sentence' && request.method === 'POST') {
				const body: SentenceRequest = await request.json();
				const sentence = await generateSentence(env.DB, body);
				
				if (!sentence) {
					return Response.json(
						{ success: false, error: 'Unable to generate sentence. Database may be empty.' },
						{ status: 400, headers: corsHeaders }
					);
				}

				return Response.json({ success: true, data: { sentence } }, { headers: corsHeaders });
			}

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

async function generateSentence(db: D1Database, options: SentenceRequest): Promise<string | null> {
	const parts: string[] = [];

	try {
		if (options.includeAdjective) {
			const adjective = await getRandomWord(db, 'adjective');
			if (adjective) parts.push(adjective);
		}

		if (options.includeNoun) {
			const noun = await getRandomWord(db, 'noun');
			if (noun) parts.push(noun);
		}

		if (options.includeAdverb) {
			const adverb = await getRandomWord(db, 'adverb');
			if (adverb) parts.push(adverb);
		}

		if (options.includeVerb) {
			const verb = await getRandomWord(db, 'verb');
			if (verb) parts.push(verb);
		}

		if (parts.length === 0) {
			return null;
		}

		const sentence = parts.join(' ');
		return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
	} catch (error) {
		console.error('Error generating sentence:', error);
		return null;
	}
}

async function getRandomWord(db: D1Database, categoryName: string): Promise<string | null> {
	try {
		const result = await db.prepare(`
			SELECT w.word 
			FROM Words w
			JOIN Categories c ON w.category_id = c.id
			WHERE c.name = ?
			ORDER BY RANDOM()
			LIMIT 1
		`).bind(categoryName).first<Word>();

		return result?.word || null;
	} catch (error) {
		console.error(`Error fetching random ${categoryName}:`, error);
		return null;
	}
}
