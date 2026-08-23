import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../db/db.service';
import { IOtpProvider, OTP_PROVIDER } from './otp-provider.interface';

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
    @Inject(OTP_PROVIDER) private otpProvider: IOtpProvider
  ) {}

  async requestOtp(phone: string) {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian mobile number',
      });
    }

    return await this.otpProvider.sendOtp(phone);
  }

  async verifyOtp(phone: string, otp: string, fullName?: string) {
    const verifyRes = await this.otpProvider.verifyOtp(phone, otp);
    if (!verifyRes.success) {
      throw new UnauthorizedException({
        code: 'INVALID_OTP',
        message: verifyRes.message,
      });
    }

    // 1. Find or create user
    const userRes = await this.db.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );

    let user = userRes.rows[0];
    if (!user) {
      const name = fullName || `User ${phone.slice(-4)}`;
      const newUserRes = await this.db.query(
        `INSERT INTO users (phone, full_name, preferred_language)
         VALUES ($1, $2, 'mr')
         RETURNING *`,
        [phone, name]
      );
      user = newUserRes.rows[0];
    } else if (fullName && user.full_name !== fullName) {
      await this.db.query(
        `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`,
        [fullName, user.id]
      );
      user.full_name = fullName;
    }

    // 2. Activate pending member invites
    await this.db.query(
      `UPDATE mandal_members 
       SET status = 'ACTIVE', updated_at = NOW()
       WHERE user_id = $1 AND status = 'PENDING'`,
      [user.id]
    );

    // 3. Fetch mandal memberships
    const membershipsRes = await this.db.query(
      `SELECT m.*, mm.role, mm.status as member_status
       FROM mandal_members mm
       JOIN mandals m ON m.id = mm.mandal_id
       WHERE mm.user_id = $1 AND mm.status = 'ACTIVE' AND m.is_active = TRUE`,
      [user.id]
    );

    const memberships = membershipsRes.rows;
    const activeMandalIds = memberships.map((m) => m.id);

    // If user has no mandal, default demo mandal or empty
    const primaryMembership = memberships[0] || null;

    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      mandalId: primaryMembership ? primaryMembership.id : null,
      role: primaryMembership ? primaryMembership.role : null,
      activeMandalIds,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: process.env.JWT_SECRET || 'vargani-jwt-secret-key-2024',
      expiresIn: '30d',
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        preferredLanguage: user.preferred_language,
      },
      activeMandal: primaryMembership,
      memberships,
      accessToken,
    };
  }

  async switchMandal(userId: string, mandalId: string) {
    const memberRes = await this.db.query(
      `SELECT mm.*, m.name, m.slug, m.festival_type
       FROM mandal_members mm
       JOIN mandals m ON m.id = mm.mandal_id
       WHERE mm.user_id = $1 AND mm.mandal_id = $2 AND mm.status = 'ACTIVE'`,
      [userId, mandalId]
    );

    if (memberRes.rowCount === 0) {
      throw new BadRequestException({
        code: 'MANDAL_NOT_MEMBER',
        message: 'You are not an active member of this mandal',
      });
    }

    const membership = memberRes.rows[0];

    const allMembershipsRes = await this.db.query(
      `SELECT mandal_id FROM mandal_members WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );
    const activeMandalIds = allMembershipsRes.rows.map((r) => r.mandal_id);

    const userRes = await this.db.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];

    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      mandalId: membership.mandal_id,
      role: membership.role,
      activeMandalIds,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: process.env.JWT_SECRET || 'vargani-jwt-secret-key-2024',
      expiresIn: '30d',
    });

    return {
      accessToken,
      activeMandal: membership,
    };
  }
}
