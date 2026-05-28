import { generateId } from './auth';

export interface HistoryItem {
  id: string;
  sentence: string;
  createdAt: string;
  options: {
    includeNoun?: boolean;
    includeVerb?: boolean;
    includeAdjective?: boolean;
    includeAdverb?: boolean;
  };
}

export interface CreateHistoryOptions {
  includeNoun?: boolean;
  includeVerb?: boolean;
  includeAdjective?: boolean;
  includeAdverb?: boolean;
}

export class HistoryService {
  constructor(private db: D1Database) {}

  async createHistory(
    userId: string,
    sentence: string,
    options: CreateHistoryOptions
  ): Promise<HistoryItem> {
    const id = generateId();
    const now = Date.now();

    await this.db
      .prepare(
        `INSERT INTO sentence_history 
        (id, user_id, sentence, include_noun, include_verb, include_adjective, include_adverb, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        userId,
        sentence,
        options.includeNoun ? 1 : 0,
        options.includeVerb ? 1 : 0,
        options.includeAdjective ? 1 : 0,
        options.includeAdverb ? 1 : 0,
        now
      )
      .run();

    return {
      id,
      sentence,
      createdAt: new Date(now).toISOString(),
      options: {
        includeNoun: options.includeNoun,
        includeVerb: options.includeVerb,
        includeAdjective: options.includeAdjective,
        includeAdverb: options.includeAdverb,
      },
    };
  }

  async getHistory(userId: string, limit: number = 50): Promise<HistoryItem[]> {
    const results = await this.db
      .prepare(
        `SELECT id, sentence, include_noun, include_verb, include_adjective, include_adverb, created_at 
        FROM sentence_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?`
      )
      .bind(userId, limit)
      .all<{
        id: string;
        sentence: string;
        include_noun: number;
        include_verb: number;
        include_adjective: number;
        include_adverb: number;
        created_at: number;
      }>();

    return (results.results || []).map((row) => ({
      id: row.id,
      sentence: row.sentence,
      createdAt: new Date(row.created_at).toISOString(),
      options: {
        includeNoun: row.include_noun === 1,
        includeVerb: row.include_verb === 1,
        includeAdjective: row.include_adjective === 1,
        includeAdverb: row.include_adverb === 1,
      },
    }));
  }

  async deleteHistory(userId: string, historyId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM sentence_history WHERE id = ? AND user_id = ?')
      .bind(historyId, userId)
      .run();

    return result.success;
  }

  async clearHistory(userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM sentence_history WHERE user_id = ?')
      .bind(userId)
      .run();

    return result.success;
  }

  async saveSentence(userId: string, sentence: string): Promise<HistoryItem> {
    const id = generateId();
    const now = Date.now();

    await this.db
      .prepare(
        `INSERT INTO sentence_history 
        (id, user_id, sentence, include_noun, include_verb, include_adjective, include_adverb, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, sentence, 0, 0, 0, 0, now)
      .run();

    return {
      id,
      sentence,
      createdAt: new Date(now).toISOString(),
      options: {},
    };
  }
}
