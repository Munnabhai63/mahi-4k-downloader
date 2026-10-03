import { Controller, Post, Get, Body, Query, Res, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyzeService } from './analyze.service';
import { AnalyzeResult } from '@turbograb/types';

export class AnalyzeDto {
  @ApiProperty({
    description: 'Target video URL (YouTube, Instagram, Facebook, X, TikTok, Vimeo, etc.)',
    example: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  })
  url!: string;
}

export class BatchAnalyzeDto {
  @ApiProperty({
    description: 'Array of target video URLs (up to 50 URLs)',
    example: ['https://www.youtube.com/watch?v=aqz-KE-bpKQ'],
  })
  urls!: string[];
}

@ApiTags('Analyze')
@Controller('api/v1/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze a video URL, extract available qualities, formats and metadata' })
  @ApiResponse({ status: 200, description: 'Metadata extracted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL, DRM-blocked platform, or extraction failed' })
  async analyze(@Body() body: AnalyzeDto): Promise<AnalyzeResult> {
    if (!body || !body.url || typeof body.url !== 'string') {
      throw new BadRequestException('A valid "url" string field is required.');
    }
    return this.analyzeService.analyze(body.url);
  }

  @Get('thumbnail-proxy')
  @ApiOperation({ summary: 'Stream video thumbnail image with CORS and cache headers' })
  @ApiQuery({ name: 'url', required: true, description: 'Original image URL' })
  @ApiQuery({ name: 'download', required: false, description: 'Set to 1 to force file download' })
  async proxyThumbnail(
    @Query('url') imageUrl: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    if (!imageUrl) {
      throw new BadRequestException('Query parameter "url" is required.');
    }
    return this.analyzeService.proxyThumbnail(imageUrl, download === '1', res);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze up to 50 video URLs simultaneously in batch' })
  @ApiResponse({ status: 200, description: 'Batch metadata extracted' })
  async analyzeBatch(@Body() body: BatchAnalyzeDto) {
    if (!body || !Array.isArray(body.urls)) {
      throw new BadRequestException('A valid "urls" array is required.');
    }
    return this.analyzeService.batchAnalyze(body.urls);
  }
}

