import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '@vargani/types';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: Role): ExecutionContext => {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : undefined,
        }),
      }),
    } as any;
  };

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(Role.VOLUNTEER);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN access to ADMIN-required endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.ADMIN);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('should DENY TREASURER access to ADMIN-only endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.TREASURER);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should DENY VOLUNTEER access to TREASURER endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TREASURER, Role.ADMIN]);
    const context = createMockContext(Role.VOLUNTEER);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow TREASURER access to VOLUNTEER endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VOLUNTEER]);
    const context = createMockContext(Role.TREASURER);
    expect(rolesGuard.canActivate(context)).toBe(true);
  });
});
