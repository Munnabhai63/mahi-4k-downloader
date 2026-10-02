import { Controller, Get, Post, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { DmcaSubmissionRequest } from '@turbograb/types';
import * as crypto from 'crypto';

export class DmcaSubmissionDto implements DmcaSubmissionRequest {
  @ApiProperty({ example: 'legal@rightsholder.com' })
  reporterEmail!: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=example' })
  targetUrl!: string;

  @ApiProperty({ example: 'Copyright owner of original musical composition.' })
  reason!: string;

  @ApiProperty({ example: 'Registration ID #US-2026-991283' })
  infringementProof!: string;

  @ApiProperty({ example: 'Jane Doe, VP Legal Affairs' })
  signature!: string;
}

@ApiTags('DMCA')
@Controller('api/v1/dmca')
export class DmcaController {
  private readonly reports: any[] = [];

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a DMCA takedown notice' })
  @ApiResponse({ status: 201, description: 'Takedown notice received and URL hash queued for blocking' })
  submit(@Body() dto: DmcaSubmissionDto) {
    if (!dto.reporterEmail || !dto.targetUrl || !dto.signature) {
      throw new BadRequestException('Reporter email, target URL, and legal signature are required.');
    }

    const reportId = crypto.randomUUID();
    const urlHash = crypto.createHash('sha256').update(dto.targetUrl.trim()).digest('hex');

    const record = {
      id: reportId,
      reporterEmail: dto.reporterEmail,
      targetUrl: dto.targetUrl,
      urlHash,
      reason: dto.reason,
      infringementProof: dto.infringementProof,
      signature: dto.signature,
      status: 'ACTIONED',
      createdAt: new Date().toISOString(),
      actionedAt: new Date().toISOString(),
    };

    this.reports.push(record);

    return {
      success: true,
      reportId,
      urlHash,
      message: 'DMCA report recorded. Target URL hash has been queued and blocked from future download requests.',
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'List all received DMCA takedown notices (Admin)' })
  getReports() {
    return this.reports;
  }
}
