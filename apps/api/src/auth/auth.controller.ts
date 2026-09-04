import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { changePasswordSchema, loginSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';
import { z } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown) {
    const input = parseRequest(loginSchema, body);
    const result = await this.authService.login(input.username, input.password);
    return {
      success: true,
      code: 'AUTH_SUCCESS',
      message: 'Login successful',
      data: result,
    };
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() body: unknown
  ) {
    const input = parseRequest(changePasswordSchema, body);
    const result = await this.authService.changePassword(
      userId,
      input.current_password,
      input.new_password
    );
    return {
      success: true,
      code: 'PASSWORD_CHANGED',
      message: result.message,
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
