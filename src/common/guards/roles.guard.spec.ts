import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const buildContext = (user?: { id: string; role: UserRole }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as never;

  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(buildContext({ id: 'agent-1', role: UserRole.AGENT })),
    ).toBe(true);
  });

  it('allows access when the user role is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(buildContext({ id: 'admin-1', role: UserRole.ADMIN })),
    ).toBe(true);
  });

  it('denies access when the user role is not required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(buildContext({ id: 'agent-1', role: UserRole.AGENT })),
    ).toThrow(ForbiddenException);
  });
});
