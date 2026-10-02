import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService, AdminTelemetry, AdminAuditLog, SystemSettings } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { UserProfile, DownloadItem } from '@turbograb/types';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  private verifyAdminRole(authHeader?: string): UserProfile {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin authorization token required.');
    }
    const token = authHeader.substring('Bearer '.length);
    const user = this.authService.getUserFromToken(token);
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin privileges required.');
    }
    return user;
  }

  @Get('overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live admin operations overview and telemetry' })
  @ApiResponse({ status: 200, description: 'Admin telemetry metrics' })
  getOverview(): AdminTelemetry {
    return this.adminService.getOverview();
  }

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all registered users and their tiers' })
  getUsers(): UserProfile[] {
    return this.adminService.getUsers();
  }

  @Post('users/:id/ban')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban or reinstate user access' })
  banUser(
    @Param('id') userId: string,
    @Body('isBanned') isBanned: boolean,
    @Headers('authorization') authHeader?: string,
  ): UserProfile {
    const actor = authHeader ? this.verifyAdminRole(authHeader).email : 'admin';
    return this.adminService.banUser(userId, isBanned, actor);
  }

  @Post('users/:id/plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user plan tier (free, premium, student)' })
  updatePlan(
    @Param('id') userId: string,
    @Body('planId') planId: string,
    @Headers('authorization') authHeader?: string,
  ): UserProfile {
    const actor = authHeader ? this.verifyAdminRole(authHeader).email : 'admin';
    return this.adminService.updateUserPlan(userId, planId, actor);
  }

  @Get('downloads')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global real-time downloads feed' })
  getDownloadsFeed(): DownloadItem[] {
    return this.adminService.getDownloadsFeed();
  }

  @Post('downloads/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emergency cancel download job' })
  cancelDownload(
    @Param('id') downloadId: string,
    @Headers('authorization') authHeader?: string,
  ): DownloadItem {
    const actor = authHeader ? this.verifyAdminRole(authHeader).email : 'admin';
    return this.adminService.cancelDownload(downloadId, actor);
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get immutable audit log records' })
  getAuditLogs(): AdminAuditLog[] {
    return this.adminService.getAuditLogs();
  }

  @Get('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system runtime configuration and banner status' })
  getSettings(): SystemSettings {
    return this.adminService.getSettings();
  }

  @Post('settings')
  @Put('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system runtime configuration and banner status' })
  updateSettings(
    @Body() patch: Partial<SystemSettings>,
    @Headers('authorization') authHeader?: string,
  ): SystemSettings {
    const actor = authHeader ? this.verifyAdminRole(authHeader).email : 'admin';
    return this.adminService.updateSettings(patch, actor);
  }

  @Get('public-config')
  @ApiOperation({ summary: 'Get public dynamic system configuration for users' })
  getPublicConfig() {
    return this.adminService.getPublicConfig();
  }
}
