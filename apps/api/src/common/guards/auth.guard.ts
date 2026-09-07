import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getJwtSecret } from '../security/auth-config';
import { DbService } from '../../db/db.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Optional() private db?: DbService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing',
      });
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: getJwtSecret(),
      });
      (request as any).user = payload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Session expired or invalid token',
      });
    }

    // Verify member is not REVOKED/deactivated in real-time
    if (this.db && payload.userId && payload.mandalId) {
      const memberCheck = await this.db.query(
        `SELECT status FROM mandal_members WHERE user_id = $1 AND mandal_id = $2`,
        [payload.userId, payload.mandalId]
      );
      if (memberCheck.rows.length > 0 && memberCheck.rows[0].status === 'REVOKED') {
        throw new UnauthorizedException({
          code: 'ACCOUNT_DEACTIVATED',
          message: 'खाते निष्क्रिय करण्यात आले आहे. कृपया व्यवस्थापकाशी (Admin) संपर्क साधा. (Account has been deactivated. Please contact Admin.)',
        });
      }
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
