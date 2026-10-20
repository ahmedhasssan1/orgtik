import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { RequestStatus } from '../common/enums/request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import type { User } from '../common/interfaces/user.interface';
import { AssignRequestDto } from './dto/assign-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RequestActivity } from './entities/request-activity.entity';
import { SalesRequest } from './entities/sales-request.entity';

const statusOrder = [
  RequestStatus.NEW,
  RequestStatus.CONTACTED,
  RequestStatus.QUALIFIED,
  RequestStatus.CLOSED,
];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(SalesRequest)
    private readonly requests: Repository<SalesRequest>,
    @InjectRepository(RequestActivity)
    private readonly activities: Repository<RequestActivity>,
  ) {}

  async list(
    query: ListRequestsQueryDto,
    user: User,
  ): Promise<{
    data: SalesRequest[];
    page: number;
    limit: number;
    total: number;
  }> {
    const builder = this.requests.createQueryBuilder('request');
    if (user.role === UserRole.AGENT) {
      builder.andWhere('request.assignedTo = :agentId', { agentId: user.id });
    }
    if (query.status) {
      builder.andWhere('request.status = :status', { status: query.status });
    }
    if (query.search) {
      builder.andWhere(
        '(request.externalId ILIKE :search OR request.customerName ILIKE :search OR request.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await builder
      .orderBy('request.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { data, page: query.page, limit: query.limit, total };
  }

  async getById(id: string, user: User): Promise<SalesRequest> {
    const request = await this.requests.findOne({
      where: { id },
      relations: { activities: true },
      order: { activities: { createdAt: 'ASC' } },
    });
    if (!request || !this.canAccess(request, user)) {
      throw new NotFoundException('Sales request not found.');
    }
    return request;
  }

  async assign(
    id: string,
    dto: AssignRequestDto,
    user: User,
  ): Promise<SalesRequest> {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Sales request not found.');
    }

    if (request.assignedTo !== dto.agentId) {
      const previousAgent = request.assignedTo;
      request.assignedTo = dto.agentId;
      await this.requests.save(request);
      await this.activities.save(
        this.activities.create({
          requestId: request.id,
          action: ActivityAction.ASSIGNED,
          fromValue: previousAgent,
          toValue: dto.agentId,
          userId: user.id,
        }),
      );
    }
    return request;
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: User,
  ): Promise<SalesRequest> {
    const request = await this.requests.findOne({ where: { id } });
    if (!request || !this.canAccess(request, user)) {
      throw new NotFoundException('Sales request not found.');
    }

    const currentIndex = statusOrder.indexOf(request.status);
    if (statusOrder[currentIndex + 1] !== dto.status) {
      throw new BadRequestException(
        `Status must move forward one step from ${request.status}.`,
      );
    }

    const previousStatus = request.status;
    request.status = dto.status;
    await this.requests.save(request);
    await this.activities.save(
      this.activities.create({
        requestId: request.id,
        action: ActivityAction.STATUS_CHANGED,
        fromValue: previousStatus,
        toValue: dto.status,
        userId: user.id,
      }),
    );
    return request;
  }

  private canAccess(request: SalesRequest, user: User): boolean {
    return user.role === UserRole.ADMIN || request.assignedTo === user.id;
  }
}
