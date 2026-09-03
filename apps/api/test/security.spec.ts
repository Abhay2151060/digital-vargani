import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Security & Authentication Tests', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret-key-2024',
    });
    authGuard = new AuthGuard(jwtService);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
          query: {},
        }),
      }),
    } as any;
  };

  describe('AuthGuard', () => {
    it('should throw UnauthorizedException when no Authorization header is provided', async () => {
      const context = createMockContext(undefined);
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired or malformed', async () => {
      const context = createMockContext('Bearer invalid.jwt.token');
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept a valid Bearer token and attach payload to request.user', async () => {
      const payload = { userId: 'user-123', mandalId: 'mandal-123', role: 'ADMIN' };
      const validToken = jwtService.sign(payload, { secret: 'vargani-jwt-secret-key-2024' });

      const request: any = {
        headers: { authorization: `Bearer ${validToken}` },
        query: {},
      };
      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as any;

      const canActivate = await authGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(request.user).toBeDefined();
      expect(request.user.userId).toBe('user-123');
      expect(request.user.role).toBe('ADMIN');
    });

    it('should reject tokens supplied through query parameters to avoid URL leakage', async () => {
      const payload = { userId: 'user-456', mandalId: 'mandal-123', role: 'TREASURER' };
      const validToken = jwtService.sign(payload, { secret: 'vargani-jwt-secret-key-2024' });

      const request: any = {
        headers: {},
        query: { token: validToken },
      };
      const context: ExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as any;

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('AllExceptionsFilter Error Sanitization', () => {
    let filter: AllExceptionsFilter;

    beforeEach(() => {
      filter = new AllExceptionsFilter();
    });

    it('should sanitize internal database/server error messages in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockHost: any = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      };

      const internalError = new Error('FATAL: password authentication failed for user "postgres"');
      filter.catch(internalError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred. Please try again later.',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
