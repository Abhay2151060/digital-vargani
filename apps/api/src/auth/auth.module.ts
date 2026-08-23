import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OTP_PROVIDER } from './otp-provider.interface';
import { MockOtpProvider } from './mock-otp.provider';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'vargani-jwt-secret-key-2024',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: OTP_PROVIDER,
      useClass: MockOtpProvider,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
