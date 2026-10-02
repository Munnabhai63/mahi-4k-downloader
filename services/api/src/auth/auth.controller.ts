import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse, UserProfile } from '@turbograb/types';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: AuthRegisterRequest): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT access and refresh tokens' })
  async login(@Body() dto: AuthLoginRequest): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate access token with refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthResponse> {
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Headers('authorization') authHeader?: string): Promise<UserProfile> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization Bearer token required.');
    }
    const token = authHeader.substring('Bearer '.length);
    return this.authService.getUserFromToken(token);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile alias' })
  async profile(@Headers('authorization') authHeader?: string): Promise<UserProfile> {
    return this.me(authHeader);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and terminate session' })
  logout(): { success: boolean } {
    return { success: true };
  }
}
