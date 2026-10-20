import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { MockAuthGuard } from '../src/common/guards/mock-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { RequestsController } from '../src/requests/requests.controller';
import { RequestsService } from '../src/requests/requests.service';

describe('Requests API (e2e)', () => {
  let app: INestApplication<App>;
  const requestsService = {
    list: jest.fn().mockResolvedValue({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
    }),
    assign: jest
      .fn()
      .mockResolvedValue({ id: 'request-1', assignedTo: 'agent-2' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        MockAuthGuard,
        RolesGuard,
        { provide: RequestsService, useValue: requestsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires mock authentication for request management endpoints', async () => {
    await request(app.getHttpServer()).get('/requests').expect(401);
  });

  it('accepts an authenticated admin and returns a paginated response', async () => {
    await request(app.getHttpServer())
      .get('/requests?page=1&limit=20')
      .set('x-user-role', 'admin')
      .expect(200)
      .expect({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });
  });

  it('forbids agents from assigning requests', async () => {
    await request(app.getHttpServer())
      .post('/requests/123e4567-e89b-12d3-a456-426614174000/assign')
      .set('x-user-role', 'agent')
      .send({ agentId: 'agent-2' })
      .expect(403);
  });

  it('allows admins to assign requests', async () => {
    await request(app.getHttpServer())
      .post('/requests/123e4567-e89b-12d3-a456-426614174000/assign')
      .set('x-user-role', 'admin')
      .send({ agentId: 'agent-2' })
      .expect(201)
      .expect({ id: 'request-1', assignedTo: 'agent-2' });
  });
});
