import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '@vargani/types';

describe('RolesGuard & RBAC Matrix', () => {
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

  it('should throw ForbiddenException if user is not present on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VOLUNTEER]);
    const context = createMockContext(undefined);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
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

  it('should DENY VOLUNTEER access to ADMIN-only endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.VOLUNTEER);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should DENY VOLUNTEER access to shared TREASURER & ADMIN endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TREASURER, Role.ADMIN]);
    const context = createMockContext(Role.VOLUNTEER);
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow TREASURER and ADMIN access to shared endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TREASURER, Role.ADMIN]);
    expect(rolesGuard.canActivate(createMockContext(Role.TREASURER))).toBe(true);
    expect(rolesGuard.canActivate(createMockContext(Role.ADMIN))).toBe(true);
  });

  it('should allow ONLY TREASURER access to New Donation Receipt endpoints (DENY both ADMIN and VOLUNTEER)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TREASURER]);
    const volunteerContext = createMockContext(Role.VOLUNTEER);
    expect(() => rolesGuard.canActivate(volunteerContext)).toThrow(ForbiddenException);

    const adminContext = createMockContext(Role.ADMIN);
    expect(() => rolesGuard.canActivate(adminContext)).toThrow(ForbiddenException);

    const treasurerContext = createMockContext(Role.TREASURER);
    expect(rolesGuard.canActivate(treasurerContext)).toBe(true);
  });

  it('should DENY non-admin users from expense approvals and member invitations', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    
    expect(() => rolesGuard.canActivate(createMockContext(Role.VOLUNTEER))).toThrow(ForbiddenException);
    expect(() => rolesGuard.canActivate(createMockContext(Role.TREASURER))).toThrow(ForbiddenException);
    expect(rolesGuard.canActivate(createMockContext(Role.ADMIN))).toBe(true);
  });
});
