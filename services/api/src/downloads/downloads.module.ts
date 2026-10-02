import { Module } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { DownloadsController, HistoryController } from './downloads.controller';
import { EventsModule } from '../events/events.module';
import { AnalyzeModule } from '../analyze/analyze.module';
import { CookiesModule } from '../cookies/cookies.module';

@Module({
  imports: [EventsModule, AnalyzeModule, CookiesModule],
  controllers: [DownloadsController, HistoryController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
