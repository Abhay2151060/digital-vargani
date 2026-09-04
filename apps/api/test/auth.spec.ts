import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { DbService } from '../src/db/db.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { hashPassword } from '../src/common/security/password.util';

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
    it('should reject missing username or password', async () => {
      await expect(authService.login('', 'user123')).rejects.toThrow(BadRequestException);
      await expect(authService.login('abhay', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockDbService.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await expect(authService.login('unknown_user', 'user123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const passwordHash = hashPassword('correctPassword');
      const mockUser = {
        id: 'user-1',
        username: 'abhay',
        full_name: 'Abhay Solapure',
        password_hash: passwordHash,
        must_change_password: false,
      };

      mockDbService.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
      await expect(authService.login('abhay', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should successfully authenticate with valid credentials and return JWT', async () => {
      const passwordHash = hashPassword('user123');
      const mockUser = {
        id: 'user-1',
        username: 'abhay',
        phone: '8421692967',
        full_name: 'Abhay Solapure',
        password_hash: passwordHash,
        must_change_password: true,
        preferred_language: 'mr',
      };

      mockDbService.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // SELECT user
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE pending member invites
        .mockResolvedValueOnce({
          rows: [{ id: 'mandal-1', name: 'Shree Shivneri Mitra Mandal', role: 'ADMIN' }],
          rowCount: 1,
        }); // SELECT memberships

      const res = await authService.login('abhay', 'user123');

      expect(res.accessToken).toBe('mocked-jwt-token');
      expect(res.user.username).toBe('abhay');
      expect(res.mustChangePassword).toBe(true);
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should reject new password shorter than 6 characters', async () => {
      await expect(
        authService.changePassword('user-1', 'user123', '123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject incorrect current password', async () => {
      const passwordHash = hashPassword('currentPassword');
      mockDbService.query.mockResolvedValueOnce({
        rows: [{ id: 'user-1', password_hash: passwordHash }],
        rowCount: 1,
      });

      await expect(
        authService.changePassword('user-1', 'wrongCurrent', 'newPassword123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update password and clear must_change_password', async () => {
      const passwordHash = hashPassword('currentPassword');
      mockDbService.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-1', password_hash: passwordHash }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE users

      const res = await authService.changePassword(
        'user-1',
        'currentPassword',
        'newPassword123'
      );

      expect(res.success).toBe(true);
      expect(mockDbService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['user-1'])
      );
    });
  });
});
