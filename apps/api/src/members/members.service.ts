import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { InviteMemberInput, Role, MemberStatus } from '@vargani/types';
import { DEFAULT_PASSWORD, DEFAULT_PASSWORD_HASH } from '../common/security/password.util';

@Injectable()
export class MembersService {
  constructor(private db: DbService) {}

  async listMembers(mandalId: string) {
    const res = await this.db.query(
      `SELECT mm.id, mm.mandal_id, mm.user_id, mm.role, mm.status, mm.created_at,
              u.full_name, u.phone, u.preferred_language, u.must_change_password
       FROM mandal_members mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.mandal_id = $1
       ORDER BY mm.created_at ASC`,
      [mandalId],
      [mandalId]
    );
    return res.rows;
  }

  async inviteMember(inviterId: string, input: InviteMemberInput) {
    return await this.db.withTransaction(async (client) => {
      const mandalRes = await client.query(`SELECT name FROM mandals WHERE id = $1`, [input.mandal_id]);
      const mandalName = mandalRes.rows[0]?.name || 'मंडळ';

      // 1. Find or create user by phone or full name
      let user: any = null;
      if (input.phone && input.phone.trim()) {
        const phoneCheck = await client.query(`SELECT * FROM users WHERE phone = $1`, [input.phone.trim()]);
        if (phoneCheck.rowCount && phoneCheck.rowCount > 0) {
          user = phoneCheck.rows[0];
          await client.query(
            `UPDATE users 
             SET full_name = $1, 
                 password_hash = COALESCE(password_hash, $2),
                 updated_at = NOW() 
             WHERE id = $3`,
            [input.full_name.trim(), DEFAULT_PASSWORD_HASH, user.id]
          );
          user.full_name = input.full_name.trim();
        }
      }

      if (!user) {
        const userByName = await client.query(
          `SELECT * FROM users WHERE LOWER(full_name) = LOWER($1) ORDER BY created_at ASC LIMIT 1`,
          [input.full_name.trim()]
        );
        if (userByName.rowCount && userByName.rowCount > 0) {
          user = userByName.rows[0];
          if (input.phone && input.phone.trim() && !user.phone) {
            await client.query(`UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2`, [input.phone.trim(), user.id]);
            user.phone = input.phone.trim();
          }
        } else {
          const newUserRes = await client.query(
            `INSERT INTO users (phone, full_name, password_hash, must_change_password)
             VALUES ($1, $2, $3, TRUE)
             RETURNING *`,
            [input.phone?.trim() || null, input.full_name.trim(), DEFAULT_PASSWORD_HASH]
          );
          user = newUserRes.rows[0];
        }
      }

      // 2. Add or update mandal member
      const memberRes = await client.query(
        `INSERT INTO mandal_members (mandal_id, user_id, role, status, invited_by)
         VALUES ($1, $2, $3, 'ACTIVE', $4)
         ON CONFLICT (mandal_id, user_id) 
         DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE', updated_at = NOW()
         RETURNING *`,
        [input.mandal_id, user.id, input.role, inviterId]
      );

      const loginUrl = 'https://digital-vargani-mu.vercel.app/login';
      const shareableMessage = `🚩 *${mandalName} - डिजिटल वर्गणी लॉगिन माहिती*\n\nनमस्कार ${input.full_name},\nआपणांस डिजिटल वर्गणी प्रणालीमध्ये *${input.role}* म्हणून समाविष्ट करण्यात आले आहे.\n\n🔗 *लॉगिन लिंक:* ${loginUrl}\n👤 *लॉगिन नाव / मोबाईल:* ${input.full_name}${user.phone ? ' / ' + user.phone : ''}\n🔑 *पासवर्ड (Password):* ${DEFAULT_PASSWORD}\n\n⚠️ लॉगिन करण्यासाठी आपले नाव किंवा मोबाईल नंबर टाका व पहिल्या लॉगिननंतर पासवर्ड बदलून घ्या.`;

      return {
        member: memberRes.rows[0],
        user: {
          id: user.id,
          full_name: user.full_name,
          phone: user.phone,
        },
        defaultPassword: DEFAULT_PASSWORD,
        loginUrl,
        shareableMessage,
      };
    }, [input.mandal_id]);
  }

  async updateMemberStatus(mandalId: string, memberId: string, status: MemberStatus) {
    const res = await this.db.query(
      `UPDATE mandal_members
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND mandal_id = $3
       RETURNING *`,
      [status, memberId, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found' });
    }
    return res.rows[0];
  }

  async updateMemberRole(mandalId: string, memberId: string, role: Role) {
    const res = await this.db.query(
      `UPDATE mandal_members
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND mandal_id = $3
       RETURNING *`,
      [role, memberId, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found' });
    }
    return res.rows[0];
  }
}
