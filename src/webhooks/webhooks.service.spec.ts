import { DataSource, EntityManager, Repository } from 'typeorm';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { RequestStatus } from '../common/enums/request-status.enum';
import { RequestActivity } from '../requests/entities/request-activity.entity';
import { SalesRequest } from '../requests/entities/sales-request.entity';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let requestRepository: jest.Mocked<Repository<SalesRequest>>;
  let dataSource: jest.Mocked<DataSource>;
  let transactionMock: jest.Mock;

  const request = {
    id: 'request-1',
    externalId: 'ext-1',
  } as SalesRequest;

  beforeEach(() => {
    requestRepository = {
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<SalesRequest>>;
    transactionMock = jest.fn();
    dataSource = {
      transaction: transactionMock,
    } as unknown as jest.Mocked<DataSource>;
    service = new WebhooksService(requestRepository, dataSource);
  });

  it('returns the existing request for a duplicate external ID', async () => {
    requestRepository.findOneBy.mockResolvedValue(request);

    const result = await service.createFromWebhook({
      externalId: 'ext-1',
      customerName: 'Ada Customer',
      email: 'ada@example.com',
      description: 'Interested in a product',
    });

    expect(result).toEqual({ request, created: false });
    expect(transactionMock.mock.calls).toHaveLength(0);
  });

  it('creates the request with an initial status activity', async () => {
    requestRepository.findOneBy.mockResolvedValue(null);
    const saveActivity = jest.fn();
    const requestRepo = {
      create: jest
        .fn()
        .mockImplementation((value: Partial<SalesRequest>) => value),
      save: jest.fn().mockImplementation((value: Partial<SalesRequest>) => ({
        ...value,
        id: 'request-1',
      })),
    };
    const activityRepo = {
      create: jest.fn().mockImplementation((value: RequestActivity) => value),
      save: saveActivity,
    };
    const manager = {
      getRepository: jest.fn(
        (entity: typeof SalesRequest | typeof RequestActivity) =>
          entity === SalesRequest ? requestRepo : activityRepo,
      ),
    };
    transactionMock.mockImplementation(
      (callback: (entityManager: EntityManager) => Promise<SalesRequest>) =>
        callback(manager as unknown as EntityManager),
    );

    const result = await service.createFromWebhook({
      externalId: 'ext-2',
      customerName: 'Ada Customer',
      email: 'ada@example.com',
      description: 'Interested in a product',
    });

    expect(result.created).toBe(true);
    expect(result.request).toEqual(
      expect.objectContaining({
        externalId: 'ext-2',
        status: RequestStatus.NEW,
      }),
    );
    expect(saveActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ActivityAction.STATUS_CHANGED,
        toValue: RequestStatus.NEW,
        userId: 'webhook',
      }),
    );
  });
});
