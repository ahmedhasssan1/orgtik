import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestActivity } from './entities/request-activity.entity';
import { SalesRequest } from './entities/sales-request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesRequest, RequestActivity])],
  controllers: [RequestsController],
  providers: [RequestsService, MockAuthGuard, RolesGuard],
})
export class RequestsModule {}
