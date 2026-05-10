export interface SentenceOptions {
  includeNoun?: boolean;
  includeVerb?: boolean;
  includeAdjective?: boolean;
  includeAdverb?: boolean;
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
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
    try {
      // Build sentence in proper English grammar: The [Adjective] [Noun] [Verb] [Adverb]
      // Example: "The fast dog runs quickly."
      
      let adjective = '';
      let noun = '';
      let verb = '';
      let adverb = '';

      // Get adjective (modifies noun)
      if (options.adjective) {
        adjective = options.adjective.toLowerCase();
      } else if (options.includeAdjective) {
        const word = await this.getRandomWord('adjective');
        if (word) adjective = word.toLowerCase();
      }

      // Get noun
      if (options.noun) {
        noun = options.noun.toLowerCase();
      } else if (options.includeNoun) {
        const word = await this.getRandomWord('noun');
        if (word) noun = word.toLowerCase();
      }

      // Get verb
      if (options.verb) {
        verb = options.verb.toLowerCase();
      } else if (options.includeVerb) {
        const word = await this.getRandomWord('verb');
        if (word) verb = word.toLowerCase();
      }

      // Get adverb (modifies verb)
      if (options.adverb) {
        adverb = options.adverb.toLowerCase();
      } else if (options.includeAdverb) {
        const word = await this.getRandomWord('adverb');
        if (word) adverb = word.toLowerCase();
      }

      // Build sentence with proper grammar
      const parts: string[] = ['the'];

      // Add noun (e.g., "the car")
      if (noun) parts.push(noun);

      // Add verb (e.g., "drives")
      if (verb) parts.push(verb);

      // Add adverb + adjective after verb (e.g., "drives very slow")
      // Or just adverb (e.g., "drives quickly")
      // Or just adjective (e.g., "drives slow")
      if (adverb && adjective) {
        // Both: "drives very slow"
        parts.push(adverb);
        parts.push(adjective);
      } else if (adverb) {
        // Just adverb: "drives quickly"
        parts.push(adverb);
      } else if (adjective) {
        // Just adjective: "drives slow"
        parts.push(adjective);
      }

      // Return null if no meaningful content
      if (parts.length <= 1) {
        return null;
      }

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
    // Check if using new format (specific words) or old format (boolean flags)
    const hasSpecificWords = !!(options.noun || options.verb || options.adjective || options.adverb);
    const hasBooleanFlags = !!(
      options.includeNoun ||
      options.includeVerb ||
      options.includeAdjective ||
      options.includeAdverb
    );
    
    return hasSpecificWords || hasBooleanFlags;
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
   * Get words by category name
   * @param categoryName - Category name (noun, verb, adjective, adverb)
   * @returns Array of word strings
   */
  async getWordsByCategory(categoryName: string): Promise<string[]> {
    try {
      const result = await this.db.prepare(`
        SELECT DISTINCT w.word 
        FROM Words w
        JOIN Categories c ON w.category_id = c.id
        WHERE c.name = ?
        ORDER BY w.word
      `).bind(categoryName).all<{ word: string }>();

      return result.results?.map(r => r.word) || [];
    } catch (error) {
      console.error(`Error fetching ${categoryName}:`, error);
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
