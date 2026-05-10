import { generateToken, verifyToken, hashPassword, verifyPassword, generateId, type JWTPayload } from './auth';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  constructor(private db: D1Database, private jwtSecret: string) {}

  async signup(email: string, password: string, name?: string): Promise<AuthResponse> {
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = Date.now();

    await this.db
      .prepare(
        'INSERT INTO users (id, email, password_hash, name, provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(userId, email, passwordHash, name || null, 'email', now, now)
      .run();

    const user: User = {
      id: userId,
      email,
      name,
      provider: 'email',
    };

    const token = await generateToken(userId, email, this.jwtSecret);

    return { user, token };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.db
      .prepare('SELECT id, email, password_hash, name, avatar, provider FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string; email: string; password_hash: string; name: string | null; avatar: string | null; provider: string }>();

    if (!result) {
      throw new Error('Invalid email or password');
    }

    if (result.provider !== 'email') {
      throw new Error(`Please sign in with ${result.provider}`);
    }

    const isValid = await verifyPassword(password, result.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      id: result.id,
      email: result.email,
      name: result.name || undefined,
      avatar: result.avatar || undefined,
      provider: result.provider,
    };

    const token = await generateToken(result.id, result.email, this.jwtSecret);

    return { user, token };
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    return verifyToken(token, this.jwtSecret);
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT id, email, name, avatar, provider FROM users WHERE id = ?')
      .bind(userId)
      .first<{ id: string; email: string; name: string | null; avatar: string | null; provider: string }>();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      email: result.email,
      name: result.name || undefined,
      avatar: result.avatar || undefined,
      provider: result.provider,
    };
  }
}
