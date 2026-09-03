import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from '../security/auth-config';

@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token, {
          secret: getJwtSecret(),
        });
        (req as any).user = payload;
      } catch {
        // Token verification handled downstream in AuthGuard
      }
    }
    next();
  }
}
