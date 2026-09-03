import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getJwtSecret } from '../security/auth-config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: getJwtSecret(),
      });
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Session expired or invalid token',
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }
    return undefined;
  }
}
