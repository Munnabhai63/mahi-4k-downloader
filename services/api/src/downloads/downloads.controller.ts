import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { DownloadsService } from './downloads.service';
import { CreateDownloadRequest, DownloadItem, VideoFormat, VideoQualityLabel } from '@turbograb/types';
import * as fs from 'fs';

export class CreateDownloadDto implements CreateDownloadRequest {
  @ApiProperty({ description: 'Video URL', example: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' })
  url!: string;

  @ApiProperty({ description: 'Quality label', example: '1080p' })
  quality!: VideoQualityLabel;

  @ApiProperty({ description: 'Format', example: 'mp4' })
  format!: VideoFormat;

  @ApiProperty({ description: 'Subtitle language code', required: false, example: 'en' })
  subtitleLang?: string;

  @ApiProperty({ description: 'Use user cookies', required: false })
  useCookies?: boolean;
}

@ApiTags('Downloads')
@Controller('api/v1/downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Queue a new video/audio download job' })
  @ApiResponse({ status: 201, description: 'Download job queued successfully' })
  async create(@Body() body: CreateDownloadDto): Promise<DownloadItem> {
    if (!body || !body.url) {
      throw new BadRequestException('The "url" field is required to initiate a download.');
    }
    return this.downloadsService.createDownload(body);
  }

  @Get()
  @ApiOperation({ summary: 'List downloads with optional status filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by PENDING, DOWNLOADING, COMPLETED, FAILED' })
  getDownloads(@Query('status') status?: string): DownloadItem[] {
    return this.downloadsService.getDownloads(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific download job' })
  getDownload(@Param('id') id: string): DownloadItem {
    return this.downloadsService.getDownload(id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Get signed download URL for completed file' })
  getFileUrl(@Param('id') id: string, @Res() res: Response) {
    const item = this.downloadsService.getDownload(id);
    if (!item.signedUrl) {
      const filename = `${item.id}.${item.format}`;
      const signedUrl = this.downloadsService.generateSignedUrl(item.id, filename);
      return res.redirect(signedUrl);
    }
    return res.redirect(item.signedUrl);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream completed file using time-limited HMAC signed URL' })
  streamFile(
    @Param('id') id: string,
    @Query('sig') sig: string,
    @Query('exp') exp: string,
    @Query('fn') fn: string,
    @Res() res: Response,
  ) {
    if (!sig || !exp || !fn) {
      throw new BadRequestException('Missing signed URL parameters.');
    }

    const { filePath, filename } = this.downloadsService.getFilePathForStream(id, sig, exp, fn);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active download job' })
  cancel(@Param('id') id: string): DownloadItem {
    return this.downloadsService.cancelDownload(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed or cancelled download job' })
  retry(@Param('id') id: string): DownloadItem {
    return this.downloadsService.retryDownload(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a download job and purge temporary files' })
  remove(@Param('id') id: string): { success: boolean } {
    const success = this.downloadsService.deleteDownload(id);
    return { success };
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Queue a batch of video downloads (up to 50 items)' })
  async createBatch(@Body() body: { items: CreateDownloadDto[] }): Promise<{ queued: DownloadItem[]; items: DownloadItem[] }> {
    if (!body || !Array.isArray(body.items)) {
      throw new BadRequestException('A valid "items" array is required.');
    }
    const queued = await this.downloadsService.createBatchDownloads(body.items);
    return { queued, items: queued };
  }
}

@ApiTags('History')
@Controller('api/v1/history')
export class HistoryController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of completed downloads' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'format', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('format') format?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.downloadsService.getHistory({
      search,
      platform,
      format,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export download history as a CSV file' })
  exportCsv(@Res() res: Response) {
    const csvContent = this.downloadsService.exportHistoryCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="turbograb_history.csv"');
    res.send(csvContent);
  }
}
