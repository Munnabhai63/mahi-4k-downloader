import { Module } from '@nestjs/common';
import { DmcaController } from './dmca.controller';

@Module({
  controllers: [DmcaController],
})
export class DmcaModule {}
