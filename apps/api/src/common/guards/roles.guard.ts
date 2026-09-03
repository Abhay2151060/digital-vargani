import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@vargani/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException({
        code: 'ACCESS_DENIED',
        message: 'You do not have the required permissions for this action',
      });
    }

    // Check whether the user's role satisfies any of the required roles
    const userRole: Role = user.role;
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: `This action requires ${requiredRoles.join(' or ')} access`,
      });
    }

    return true;
  }
}
