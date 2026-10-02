import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthResponse,
  UserProfile,
  UserRole,
} from '@turbograb/types';

interface InternalUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  planId: string;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AuthService {
  private users = new Map<string, InternalUser>();
  private refreshTokens = new Map<string, string>(); // token -> userId
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'turbograb-jwt-super-secret-key-2026';

    // Seed default admin and demo user
    this.seedUser('admin@turbograb.app', 'AdminPassword123!', 'System Admin', 'ADMIN', 'premium');
    this.seedUser('demo@turbograb.app', 'DemoPassword123!', 'Demo Student', 'USER', 'free');
    // Also support simple test password
    this.seedUser('demo2@turbograb.app', 'password123', 'Demo User', 'USER', 'free');
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private seedUser(email: string, pass: string, name: string, role: UserRole, planId: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(pass, salt);
    const id = crypto.randomUUID();
    this.users.set(email.toLowerCase(), {
      id,
      email: email.toLowerCase(),
      name,
      passwordHash: hash,
      salt,
      role,
      planId,
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  createJwt(payload: object, expiresInMinutes: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyJwt<T = any>(token: string): T {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token structure');
      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${body}`)
        .digest('base64url');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new Error('Invalid signature');
      }

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        throw new Error('Token expired');
      }

      return payload as T;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid or expired.');
    }
  }

  async register(dto: AuthRegisterRequest): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    if (!email || !dto.password || dto.password.length < 6) {
      throw new BadRequestException('Valid email and password (minimum 6 characters) are required.');
    }

    if (this.users.has(email)) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(dto.password, salt);
    const id = crypto.randomUUID();

    const user: InternalUser = {
      id,
      email,
      name: dto.name || email.split('@')[0],
      passwordHash: hash,
      salt,
      role: 'USER',
      planId: 'free',
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(email, user);

    return this.generateAuthResponse(user);
  }

  async login(dto: AuthLoginRequest): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = this.users.get(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('This account has been suspended.');
    }

    const hash = this.hashPassword(dto.password, user.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.generateAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user || user.isBanned) {
      throw new UnauthorizedException('User no longer valid.');
    }

    // Rotate refresh token
    this.refreshTokens.delete(refreshToken);
    return this.generateAuthResponse(user);
  }

  getUserFromToken(token: string): UserProfile {
    const payload = this.verifyJwt<{ sub: string; email: string }>(token);
    const user = this.users.get(payload.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.toProfile(user);
  }

  private generateAuthResponse(user: InternalUser): AuthResponse {
    const accessToken = this.createJwt(
      { sub: user.id, email: user.email, role: user.role, planId: user.planId },
      15, // 15-minute access token per §4 & §17
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    this.refreshTokens.set(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: this.toProfile(user),
    };
  }

  private toProfile(user: InternalUser): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      planId: user.planId,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values()).map((u) => this.toProfile(u));
  }

  banUser(userId: string, isBanned: boolean): UserProfile {
    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    user.isBanned = isBanned;
    user.updatedAt = new Date().toISOString();
    return this.toProfile(user);
  }

  updateUserPlan(userId: string, planId: string): UserProfile {
    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    user.planId = planId;
    user.updatedAt = new Date().toISOString();
    return this.toProfile(user);
  }
}
