import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { DbService } from '../src/db/db.service';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDbService: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockDbService = {
      query: jest.fn(),
      withTransaction: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DbService, useValue: mockDbService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should fail closed when production OTP verification is not configured', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(authService.login('9822012345')).rejects.toThrow(ServiceUnavailableException);
      expect(mockDbService.query).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should reject invalid Indian phone numbers', async () => {
      await expect(authService.login('12345')).rejects.toThrow(BadRequestException);
      await expect(authService.login('5555555555')).rejects.toThrow(BadRequestException);
    });

    it('should sign JWT token and return user profile on valid phone number', async () => {
      const mockUser = { id: 'user-1', phone: '9822012345', full_name: 'Test User', preferred_language: 'mr' };
      mockDbService.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // SELECT user
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE pending member invites
        .mockResolvedValueOnce({ rows: [{ id: 'mandal-1', name: 'Test Mandal', role: 'ADMIN' }], rowCount: 1 }); // SELECT memberships

      const res = await authService.login('9822012345');

      expect(res.accessToken).toBe('mocked-jwt-token');
      expect(res.user.phone).toBe('9822012345');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});
