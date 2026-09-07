import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../db/db.service';
import { getJwtExpiry, getJwtSecret } from '../common/security/auth-config';
import {
  DEFAULT_PASSWORD,
  DEFAULT_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../common/security/password.util';

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService
  ) {}

  /**
   * Username & Password login.
   * Only pre-created users by Admin can log in.
   */
  async login(usernameInput: string, passwordInput: string) {
    const term = (usernameInput || '').trim();
    if (!term || !passwordInput) {
      throw new BadRequestException({
        code: 'INVALID_INPUT',
        message: 'नाव किंवा मोबाईल नंबर आणि पासवर्ड आवश्यक आहे (Name/Phone and password are required)',
      });
    }

    // 1. Find user by case-insensitive full_name, phone, username, or normalized variants
    const userRes = await this.db.query(
      `SELECT * FROM users 
       WHERE LOWER(full_name) = LOWER($1)
          OR LOWER(username) = LOWER($1) 
          OR phone = $1 
          OR REPLACE(REPLACE(LOWER(full_name), '_', ''), ' ', '') = REPLACE(REPLACE(LOWER($1), '_', ''), ' ', '')
          OR REPLACE(REPLACE(LOWER(username), '_', ''), ' ', '') = REPLACE(REPLACE(LOWER($1), '_', ''), ' ', '')
          OR (
            LENGTH(REGEXP_REPLACE($1, '\\D', '', 'g')) >= 10 
            AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '\\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE($1, '\\D', '', 'g'), 10)
          )
       ORDER BY created_at ASC 
       LIMIT 1`,
      [term]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'अवैध नाव/मोबाईल किंवा पासवर्ड (Invalid Name/Phone or Password)',
      });
    }

    // 2. Verify password
    let passwordValid = false;
    if (user.password_hash) {
      passwordValid = verifyPassword(passwordInput, user.password_hash);
    } else {
      // Legacy fallback: if user had no password yet, check against default password
      if (passwordInput === DEFAULT_PASSWORD) {
        passwordValid = true;
        // Seed the hash into user record
        await this.db.query(
          `UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2`,
          [DEFAULT_PASSWORD_HASH, user.id]
        );
        user.must_change_password = true;
      }
    }

    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'अवैध नाव/मोबाईल किंवा पासवर्ड (Invalid Name/Phone or Password)',
      });
    }

    // 3. Activate pending member invites for this user
    await this.db.query(
      `UPDATE mandal_members 
       SET status = 'ACTIVE', updated_at = NOW()
       WHERE user_id = $1 AND status = 'PENDING'`,
      [user.id]
    );

    // 4. Fetch all mandal memberships for this user
    const membershipsRes = await this.db.query(
      `SELECT m.id, m.name, m.slug, m.registration_number, m.city, m.area, 
              m.festival_type, m.receipt_prefix, m.logo_url, m.upi_id, 
              m.preset_amounts, m.hide_phone_numbers, m.is_active, 
              mm.role, mm.status as member_status
       FROM mandal_members mm
       JOIN mandals m ON m.id = mm.mandal_id
       WHERE mm.user_id = $1 AND m.is_active = TRUE`,
      [user.id]
    );

    const allMemberships = membershipsRes?.rows || [];
    const activeMemberships = allMemberships.filter((m) => m.member_status === 'ACTIVE' || !m.member_status);
    const hasRevoked = allMemberships.some((m) => m.member_status === 'REVOKED');

    if (hasRevoked && activeMemberships.length === 0) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DEACTIVATED',
        message: 'तुमचे खाते निष्क्रिय (Deactivated) करण्यात आले आहे. कृपया मंडळाच्या व्यवस्थापकाशी (Admin) संपर्क साधा. (Your account has been deactivated. Please contact Admin.)',
      });
    }

    let memberships = activeMemberships;

    // Fallback: ONLY auto-assign if user has NEVER had a membership and is completely new
    if (memberships.length === 0 && allMemberships.length === 0) {
      const defaultMandalRes = await this.db.query(
        `SELECT id FROM mandals WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`
      );
      if (defaultMandalRes?.rows?.length > 0) {
        const defaultMandalId = defaultMandalRes.rows[0].id;
        const assignedRole =
          user.phone === '8421692967' || user.username === 'abhay' || user.phone === '8574968596'
            ? 'ADMIN'
            : 'VOLUNTEER';

        await this.db.query(
          `INSERT INTO mandal_members (mandal_id, user_id, role, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (mandal_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'`,
          [defaultMandalId, user.id, assignedRole]
        );

        const newMembRes = await this.db.query(
          `SELECT m.id, m.name, m.slug, m.registration_number, m.city, m.area, 
                  m.festival_type, m.receipt_prefix, m.logo_url, m.upi_id, 
                  m.preset_amounts, m.hide_phone_numbers, m.is_active, 
                  mm.role, mm.status as member_status
           FROM mandal_members mm
           JOIN mandals m ON m.id = mm.mandal_id
           WHERE mm.user_id = $1 AND mm.status = 'ACTIVE' AND m.is_active = TRUE`,
          [user.id]
        );
        memberships = newMembRes?.rows || [];
      }
    }

    if (memberships.length === 0) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DEACTIVATED',
        message: 'तुमचे खाते निष्क्रिय (Deactivated) आहे किंवा सक्रिय मंडळ आढळले नाही.',
      });
    }

    const activeMandalIds = memberships.map((m) => m.id);
    const primaryMembership = memberships[0] || null;

    const tokenPayload = {
      userId: user.id,
      full_name: user.full_name || user.username,
      fullName: user.full_name || user.username,
      phone: user.phone,
      mandalId: primaryMembership ? primaryMembership.id : null,
      role: primaryMembership ? primaryMembership.role : null,
      activeMandalIds,
      mustChangePassword: Boolean(user.must_change_password),
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: getJwtSecret(),
      expiresIn: getJwtExpiry(),
    });

    return {
      user: {
        id: user.id,
        full_name: user.full_name || user.username,
        fullName: user.full_name || user.username,
        phone: user.phone,
        preferredLanguage: user.preferred_language,
        mustChangePassword: Boolean(user.must_change_password),
      },
      activeMandal: primaryMembership,
      memberships,
      accessToken,
      mustChangePassword: Boolean(user.must_change_password),
    };
  }

  /**
   * Allows an authenticated user to change their password.
   * Sets must_change_password = FALSE upon successful change.
   */
  async changePassword(userId: string, currentPasswordInput: string, newPasswordInput: string) {
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      throw new BadRequestException({
        code: 'INVALID_PASSWORD_LENGTH',
        message: 'नवीन पासवर्ड किमान ६ अक्षरांचा असणे आवश्यक आहे (New password must be at least 6 characters)',
      });
    }

    const userRes = await this.db.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'युझर सापडला नाही (User not found)',
      });
    }

    // Verify current password
    let currentValid = false;
    if (user.password_hash) {
      currentValid = verifyPassword(currentPasswordInput, user.password_hash);
    } else {
      currentValid = currentPasswordInput === DEFAULT_PASSWORD;
    }

    if (!currentValid) {
      throw new UnauthorizedException({
        code: 'INCORRECT_CURRENT_PASSWORD',
        message: 'सध्याचा पासवर्ड चुकीचा आहे (Current password is incorrect)',
      });
    }

    const newHash = hashPassword(newPasswordInput.trim());
    await this.db.query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() 
       WHERE id = $2`,
      [newHash, userId]
    );

    return {
      success: true,
      code: 'PASSWORD_CHANGED',
      message: 'पासवर्ड यशस्वीरीत्या बदलला आहे (Password changed successfully)',
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
      username: user.username,
      phone: user.phone,
      fullName: user.full_name,
      mandalId: membership.mandal_id,
      role: membership.role,
      activeMandalIds,
      mustChangePassword: Boolean(user.must_change_password),
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: getJwtSecret(),
      expiresIn: getJwtExpiry(),
    });

    return {
      accessToken,
      activeMandal: membership,
    };
  }
}
