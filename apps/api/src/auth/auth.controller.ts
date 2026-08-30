import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { phone: string; full_name?: string }) {
    const result = await this.authService.login(body.phone, body.full_name);
    return {
      success: true,
      code: 'AUTH_SUCCESS',
      message: 'Login successful',
      data: result,
    };
  }

  // Backward-compatible endpoints
  @Post('otp/request')
  async requestOtp(@Body() body: { phone: string }) {
    const result = await this.authService.requestOtp(body.phone);
    return {
      success: true,
      code: 'OTP_SENT',
      message: result.message,
      data: { devOtp: '123456' },
    };
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: { phone: string; otp?: string; full_name?: string }) {
    const result = await this.authService.login(body.phone, body.full_name);
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
    @Body() body: { mandal_id: string }
  ) {
    const result = await this.authService.switchMandal(userId, body.mandal_id);
    return {
      success: true,
      code: 'MANDAL_SWITCHED',
      message: 'Active mandal updated',
      data: result,
    };
  }
}
