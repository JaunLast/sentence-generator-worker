export interface SentenceOptions {
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

export class SentenceFactory {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Generate a random sentence based on the provided options
   * @param options - Sentence generation options specifying which parts of speech to include
   * @returns Generated sentence or null if unable to generate
   */
  async generate(options: SentenceOptions): Promise<string | null> {
    const parts: string[] = [];

    try {
      // Build sentence in grammatical order: adjective, noun, adverb, verb
      if (options.includeAdjective) {
        const adjective = await this.getRandomWord('adjective');
        if (adjective) parts.push(adjective);
      }

      if (options.includeNoun) {
        const noun = await this.getRandomWord('noun');
        if (noun) parts.push(noun);
      }

      if (options.includeAdverb) {
        const adverb = await this.getRandomWord('adverb');
        if (adverb) parts.push(adverb);
      }

      if (options.includeVerb) {
        const verb = await this.getRandomWord('verb');
        if (verb) parts.push(verb);
      }

      // Return null if no parts were selected or found
      if (parts.length === 0) {
        return null;
      }

      // Capitalize first letter and add period
      const sentence = parts.join(' ');
      return this.formatSentence(sentence);
    } catch (error) {
      console.error('Error generating sentence:', error);
      return null;
    }
  }

  /**
   * Get a random word from the specified category
   * @param categoryName - Name of the category (noun, verb, adjective, adverb)
   * @returns Random word from the category or null if not found
   */
  private async getRandomWord(categoryName: string): Promise<string | null> {
    try {
      const result = await this.db.prepare(`
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

  /**
   * Format a sentence with proper capitalization and punctuation
   * @param sentence - Raw sentence string
   * @returns Formatted sentence with capital first letter and period
   */
  private formatSentence(sentence: string): string {
    if (!sentence || sentence.length === 0) {
      return '';
    }
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  }

  /**
   * Validate sentence options
   * @param options - Sentence generation options
   * @returns true if valid, false otherwise
   */
  static validateOptions(options: SentenceOptions): boolean {
    // At least one option must be true
    return !!(
      options.includeNoun ||
      options.includeVerb ||
      options.includeAdjective ||
      options.includeAdverb
    );
  }

  /**
   * Get all available categories
   * @returns Array of category objects
   */
  async getCategories() {
    try {
      const result = await this.db.prepare('SELECT * FROM Categories ORDER BY name').all();
      return result.results;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get words by category
   * @param categoryId - Optional category ID to filter by
   * @returns Array of word objects
   */
  async getWords(categoryId?: number) {
    try {
      let query = 'SELECT * FROM Words';
      
      if (categoryId) {
        query += ' WHERE category_id = ?';
        const result = await this.db.prepare(query).bind(categoryId).all();
        return result.results;
      }
      
      const result = await this.db.prepare(query).all();
      return result.results;
    } catch (error) {
      console.error('Error fetching words:', error);
      return [];
    }
  }

  /**
   * Get word count by category
   * @returns Object with category names as keys and word counts as values
   */
  async getWordCountByCategory(): Promise<Record<string, number>> {
    try {
      const result = await this.db.prepare(`
        SELECT c.name, COUNT(w.id) as count
        FROM Categories c
        LEFT JOIN Words w ON c.id = w.category_id
        GROUP BY c.id, c.name
      `).all();

      const counts: Record<string, number> = {};
      result.results.forEach((row: any) => {
        counts[row.name] = row.count;
      });

      return counts;
    } catch (error) {
      console.error('Error fetching word counts:', error);
      return {};
    }
  }
}
