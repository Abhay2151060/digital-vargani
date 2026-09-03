import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { loginOtpRequestSchema, loginOtpVerifySchema, loginSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';
import { z } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown) {
    const input = parseRequest(loginSchema, body);
    const result = await this.authService.login(input.phone, input.full_name);
    return {
      success: true,
      code: 'AUTH_SUCCESS',
      message: 'Login successful',
      data: result,
    };
  }

  // Backward-compatible endpoints
  @Post('otp/request')
  async requestOtp(@Body() body: unknown) {
    const input = parseRequest(loginOtpRequestSchema, body);
    const result = await this.authService.requestOtp(input.phone);
    return {
      success: true,
      code: 'OTP_SENT',
      message: result.message,
      data: process.env.NODE_ENV === 'development' ? { devOtp: '123456' } : undefined,
    };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: unknown) {
    const input = parseRequest(loginOtpVerifySchema, body);
    const result = await this.authService.verifyOtp(input.phone, input.otp, input.full_name);
    return {
      success: true,
      code: 'AUTH_SUCCESS',
      message: 'Login successful',
      data: result,
    };
  }

  @Post('switch-mandal')
  @UseGuards(AuthGuard)
  async switchMandal(
    @CurrentUser('userId') userId: string,
    @Body() body: unknown
  ) {
    const { mandal_id } = parseRequest(z.object({ mandal_id: z.string().uuid() }), body);
    const result = await this.authService.switchMandal(userId, mandal_id);
    return {
      success: true,
      code: 'MANDAL_SWITCHED',
      message: 'Active mandal updated',
      data: result,
    };
  }
}
