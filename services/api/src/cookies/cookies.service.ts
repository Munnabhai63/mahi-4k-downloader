import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CookieVaultItem, SupportedPlatform } from '@turbograb/types';

interface EncryptedCookieRecord {
  id: string;
  userId: string;
  platform: SupportedPlatform;
  ivHex: string;
  authTagHex: string;
  ciphertextHex: string;
  updatedAt: string;
}

@Injectable()
export class CookiesService {
  private records = new Map<string, EncryptedCookieRecord>(); // key: `${userId}:${platform}`
  private encKey: Buffer;

  constructor() {
    const rawSecret = process.env.COOKIES_ENCRYPTION_KEY || 'turbograb-aes-256-gcm-vault-key-2026!';
    this.encKey = crypto.createHash('sha256').update(rawSecret).digest();
  }

  saveCookie(userId: string, platform: SupportedPlatform, cookieString: string): CookieVaultItem {
    if (!cookieString || cookieString.trim().length === 0) {
      throw new BadRequestException('A valid cookie string is required.');
    }

    const iv = crypto.randomBytes(12); // 12-byte IV standard for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
    let ciphertext = cipher.update(cookieString.trim(), 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const recordKey = `${userId}:${platform}`;
    const record: EncryptedCookieRecord = {
      id: crypto.randomUUID(),
      userId,
      platform,
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
      ciphertextHex: ciphertext,
      updatedAt: new Date().toISOString(),
    };

    this.records.set(recordKey, record);

    return {
      id: record.id,
      platform: record.platform,
      hasCookie: true,
      updatedAt: record.updatedAt,
    };
  }

  getCookiesStatus(userId: string): CookieVaultItem[] {
    const platforms: SupportedPlatform[] = ['instagram', 'youtube', 'facebook', 'twitter', 'tiktok'];
    return platforms.map((platform) => {
      const recordKey = `${userId}:${platform}`;
      const record = this.records.get(recordKey);
      return {
        id: record?.id || platform,
        platform,
        hasCookie: !!record,
        hasData: !!record,
        updatedAt: record?.updatedAt || '',
      } as any;
    });
  }

  deleteCookie(userId: string, platform: SupportedPlatform): boolean {
    const recordKey = `${userId}:${platform}`;
    return this.records.delete(recordKey);
  }

  getDecryptedCookieFile(userId: string, platform: SupportedPlatform): string | null {
    const recordKey = `${userId}:${platform}`;
    const record = this.records.get(recordKey);
    if (!record) return null;

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encKey,
        Buffer.from(record.ivHex, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(record.authTagHex, 'hex'));
      let plaintext = decipher.update(record.ciphertextHex, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      // Write to temp file for yt-dlp
      const tempPath = path.join(os.tmpdir(), `tg_cookie_${record.id}.txt`);
      fs.writeFileSync(tempPath, plaintext, { mode: 0o600 });
      return tempPath;
    } catch {
      return null;
    }
  }
}
