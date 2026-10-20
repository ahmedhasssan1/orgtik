import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { RequestStatus } from '../common/enums/request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import type { User } from '../common/interfaces/user.interface';
import { RequestActivity } from './entities/request-activity.entity';
import { SalesRequest } from './entities/sales-request.entity';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestRepository: jest.Mocked<Repository<SalesRequest>>;
  let activityRepository: jest.Mocked<Repository<RequestActivity>>;

  const request = {
    id: 'request-1',
    externalId: 'ext-1',
    customerName: 'Ada Customer',
    email: 'ada@example.com',
    description: 'Interested in a product',
    status: RequestStatus.NEW,
    assignedTo: 'agent-1',
  } as SalesRequest;

  beforeEach(() => {
    requestRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<SalesRequest>>;
    activityRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<RequestActivity>>;
    service = new RequestsService(requestRepository, activityRepository);
  });

  it('does not allow an agent to view another agent request', async () => {
    requestRepository.findOne.mockResolvedValue(request);
    const user: User = { id: 'agent-2', role: UserRole.AGENT };

    await expect(service.getById(request.id, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not allow an agent to update another agent request', async () => {
    requestRepository.findOne.mockResolvedValue(request);

    await expect(
      service.updateStatus(
        request.id,
        { status: RequestStatus.CONTACTED },
        { id: 'agent-2', role: UserRole.AGENT },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(requestRepository.save.mock.calls).toHaveLength(0);
  });

  it('records the prior and next status when a request advances', async () => {
    const assignedRequest = { ...request, status: RequestStatus.NEW };
    requestRepository.findOne.mockResolvedValue(assignedRequest);
    requestRepository.save.mockResolvedValue(request);
    activityRepository.create.mockImplementation(
      (value: RequestActivity) => value,
    );

    await service.updateStatus(
      request.id,
      { status: RequestStatus.CONTACTED },
      { id: 'agent-1', role: UserRole.AGENT },
    );

    expect(assignedRequest.status).toBe(RequestStatus.CONTACTED);
    const savedActivity = activityRepository.save.mock
      .calls[0][0] as RequestActivity;
    expect(savedActivity).toEqual(
      expect.objectContaining({
        action: ActivityAction.STATUS_CHANGED,
        fromValue: RequestStatus.NEW,
        toValue: RequestStatus.CONTACTED,
        userId: 'agent-1',
      }),
    );
  });
});
