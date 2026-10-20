import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { RequestStatus } from '../common/enums/request-status.enum';
import { RequestActivity } from '../requests/entities/request-activity.entity';
import { SalesRequest } from '../requests/entities/sales-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(SalesRequest)
    private readonly requests: Repository<SalesRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async createFromWebhook(
    dto: CreateRequestDto,
  ): Promise<{ request: SalesRequest; created: boolean }> {
    const existing = await this.requests.findOneBy({
      externalId: dto.externalId,
    });
    if (existing) {
      return { request: existing, created: false };
    }

    try {
      const request = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(SalesRequest);
        const activityRepository = manager.getRepository(RequestActivity);
        const createdRequest = await repository.save(
          repository.create({ ...dto, status: RequestStatus.NEW }),
        );
        await activityRepository.save(
          activityRepository.create({
            requestId: createdRequest.id,
            action: ActivityAction.STATUS_CHANGED,
            fromValue: null,
            toValue: RequestStatus.NEW,
            userId: 'webhook',
          }),
        );
        return createdRequest;
      });
      return { request, created: true };
    } catch (error) {
      if (
        !(error instanceof QueryFailedError) ||
        (error.driverError as { code?: string }).code !== '23505'
      ) {
        throw error;
      }
      const concurrentDuplicate = await this.requests.findOneBy({
        externalId: dto.externalId,
      });
      if (!concurrentDuplicate) {
        throw error;
      }
      return { request: concurrentDuplicate, created: false };
    }
  }
}
