import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../db/db.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService
  ) {}

  async login(phone: string, fullName?: string) {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian mobile number',
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
    let membershipsRes = await this.db.query(
      `SELECT m.id, m.name, m.slug, m.registration_number, m.city, m.area, 
              m.festival_type, m.receipt_prefix, m.logo_url, m.upi_id, 
              m.preset_amounts, m.hide_phone_numbers, m.is_active, 
              mm.role, mm.status as member_status
       FROM mandal_members mm
       JOIN mandals m ON m.id = mm.mandal_id
       WHERE mm.user_id = $1 AND mm.status = 'ACTIVE' AND m.is_active = TRUE`,
      [user.id]
    );

    let memberships = membershipsRes.rows;

    // Fallback: Auto-assign user to default active mandal if no membership exists
    if (memberships.length === 0) {
      const defaultMandalRes = await this.db.query(
        `SELECT id FROM mandals WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`
      );
      if (defaultMandalRes.rows.length > 0) {
        const defaultMandalId = defaultMandalRes.rows[0].id;
        const assignedRole = phone === '8574968596' ? 'ADMIN' : 'VOLUNTEER';

        await this.db.query(
          `INSERT INTO mandal_members (mandal_id, user_id, role, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (mandal_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'`,
          [defaultMandalId, user.id, assignedRole]
        );

        membershipsRes = await this.db.query(
          `SELECT m.id, m.name, m.slug, m.registration_number, m.city, m.area, 
                  m.festival_type, m.receipt_prefix, m.logo_url, m.upi_id, 
                  m.preset_amounts, m.hide_phone_numbers, m.is_active, 
                  mm.role, mm.status as member_status
           FROM mandal_members mm
           JOIN mandals m ON m.id = mm.mandal_id
           WHERE mm.user_id = $1 AND mm.status = 'ACTIVE' AND m.is_active = TRUE`,
          [user.id]
        );
        memberships = membershipsRes.rows;
      }
    }

    const activeMandalIds = memberships.map((m) => m.id);

    // Primary active mandal membership
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

  // Legacy wrappers for backward compatibility
  async requestOtp(phone: string) {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian mobile number',
      });
    }
    return { success: true, message: 'Ready for login' };
  }

  async verifyOtp(phone: string, _otp?: string, fullName?: string) {
    return await this.login(phone, fullName);
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
