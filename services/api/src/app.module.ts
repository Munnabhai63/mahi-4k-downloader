import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AnalyzeModule } from './analyze/analyze.module';
import { DownloadsModule } from './downloads/downloads.module';
import { EventsModule } from './events/events.module';
import { DmcaModule } from './dmca/dmca.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { CookiesModule } from './cookies/cookies.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AnalyzeModule,
    DownloadsModule,
    EventsModule,
    DmcaModule,
    StatsModule,
    AuthModule,
    CookiesModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
