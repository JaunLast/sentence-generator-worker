-- Create sentence history table
CREATE TABLE IF NOT EXISTS sentence_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sentence TEXT NOT NULL,
  include_noun INTEGER DEFAULT 0,
  include_verb INTEGER DEFAULT 0,
  include_adjective INTEGER DEFAULT 0,
  include_adverb INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_user_id ON sentence_history(user_id);
CREATE INDEX idx_history_created_at ON sentence_history(created_at DESC);
