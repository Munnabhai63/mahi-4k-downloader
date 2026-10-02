import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicStats } from '@turbograb/types';

@ApiTags('Stats')
@Controller('api/v1/stats')
export class StatsController {
  @Get()
  @ApiOperation({ summary: 'Get live counters and statistics for landing page' })
  @ApiResponse({ status: 200, description: 'Live statistics' })
  getStats(): PublicStats {
    return {
      totalDownloads: 1258930,
      supportedSitesCount: 1000,
      avgSpeedMbps: 85.4,
    };
  }
}
