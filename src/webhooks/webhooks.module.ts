import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestActivity } from '../requests/entities/request-activity.entity';
import { SalesRequest } from '../requests/entities/sales-request.entity';
import { WebhookController } from './webhook.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesRequest, RequestActivity])],
  controllers: [WebhookController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
