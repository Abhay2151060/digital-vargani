export interface SendOtpResult {
  success: boolean;
  message: string;
  devOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}

export interface IOtpProvider {
  sendOtp(phone: string): Promise<SendOtpResult>;
  verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult>;
}

export const OTP_PROVIDER = 'OTP_PROVIDER';
