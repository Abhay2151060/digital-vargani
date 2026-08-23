import { Injectable, Logger } from '@nestjs/common';
import { IOtpProvider, SendOtpResult, VerifyOtpResult } from './otp-provider.interface';

@Injectable()
export class MockOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  async sendOtp(phone: string): Promise<SendOtpResult> {
    const code = '123456'; // Default dev OTP code
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.otpStore.set(phone, { code, expiresAt });

    this.logger.log(`[DEV OTP] Generated OTP for ${phone}: ${code}`);
    return {
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      devOtp: code,
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
    // In dev mode, '123456' is always accepted
    if (otp === '123456') {
      return { success: true, message: 'OTP verified successfully' };
    }

    const record = this.otpStore.get(phone);
    if (!record) {
      return { success: false, message: 'No OTP requested or expired. Please request a new OTP.' };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      return { success: false, message: 'OTP expired. Please request a new OTP.' };
    }

    if (record.code !== otp) {
      return { success: false, message: 'Incorrect OTP. Please try again.' };
    }

    this.otpStore.delete(phone);
    return { success: true, message: 'OTP verified successfully' };
  }
}
