import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { DbService } from '../src/db/db.service';
import { OTP_PROVIDER } from '../src/auth/otp-provider.interface';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDbService: any;
  let mockJwtService: any;
  let mockOtpProvider: any;

  beforeEach(async () => {
    mockDbService = {
      query: jest.fn(),
      withTransaction: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verifyAsync: jest.fn(),
    };

    mockOtpProvider = {
      sendOtp: jest.fn().mockResolvedValue({ success: true, message: 'OTP sent', devOtp: '123456' }),
      verifyOtp: jest.fn().mockImplementation((phone, otp) => {
        if (otp === '123456') {
          return Promise.resolve({ success: true, message: 'OTP verified' });
        }
        return Promise.resolve({ success: false, message: 'Invalid OTP' });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DbService, useValue: mockDbService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OTP_PROVIDER, useValue: mockOtpProvider },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('requestOtp', () => {
    it('should reject invalid Indian phone numbers', async () => {
      await expect(authService.requestOtp('12345')).rejects.toThrow(BadRequestException);
      await expect(authService.requestOtp('5555555555')).rejects.toThrow(BadRequestException);
    });

    it('should accept valid 10-digit Indian phone numbers starting with 6-9', async () => {
      const res = await authService.requestOtp('9822012345');
      expect(res.success).toBe(true);
      expect(mockOtpProvider.sendOtp).toHaveBeenCalledWith('9822012345');
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException on wrong OTP', async () => {
      await expect(authService.verifyOtp('9822012345', '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('should sign JWT token and return user profile on valid OTP', async () => {
      const mockUser = { id: 'user-1', phone: '9822012345', full_name: 'Test User', preferred_language: 'mr' };
      mockDbService.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // SELECT user
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE pending member invites
        .mockResolvedValueOnce({ rows: [{ id: 'mandal-1', name: 'Test Mandal', role: 'ADMIN' }], rowCount: 1 }); // SELECT memberships

      const res = await authService.verifyOtp('9822012345', '123456');

      expect(res.accessToken).toBe('mocked-jwt-token');
      expect(res.user.phone).toBe('9822012345');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});
