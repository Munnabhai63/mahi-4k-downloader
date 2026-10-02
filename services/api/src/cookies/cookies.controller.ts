import { Controller, Get, Post, Delete, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CookiesService } from './cookies.service';
import { CookieVaultItem, SaveCookieRequest, SupportedPlatform } from '@turbograb/types';
import { AuthService } from '../auth/auth.service';

@ApiTags('Cookies Vault')
@Controller(['api/v1/cookies', 'api/v1/me/cookies'])
export class CookiesController {
  constructor(
    private readonly cookiesService: CookiesService,
    private readonly authService: AuthService,
  ) {}

  private resolveUserId(authHeader?: string): string {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const user = this.authService.getUserFromToken(authHeader.substring('Bearer '.length));
        return user.id;
      } catch {}
    }
    return 'demo-user-default';
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get status of configured cookies in the encrypted vault' })
  @ApiResponse({ status: 200, description: 'Cookie vault platforms status' })
  getStatus(@Headers('authorization') authHeader?: string): CookieVaultItem[] {
    const userId = this.resolveUserId(authHeader);
    return this.cookiesService.getCookiesStatus(userId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Store an encrypted cookie string for a specific platform' })
  saveCookie(
    @Body() dto: SaveCookieRequest,
    @Headers('authorization') authHeader?: string,
  ): CookieVaultItem {
    const userId = this.resolveUserId(authHeader);
    const cookieContent = dto.cookieString || (dto as any).cookieData || '';
    return this.cookiesService.saveCookie(userId, dto.platform, cookieContent);
  }

  @Delete(':platform')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purge stored credentials for a platform' })
  deleteCookie(
    @Param('platform') platform: SupportedPlatform,
    @Headers('authorization') authHeader?: string,
  ): { success: boolean } {
    const userId = this.resolveUserId(authHeader);
    const success = this.cookiesService.deleteCookie(userId, platform);
    return { success };
  }
}
