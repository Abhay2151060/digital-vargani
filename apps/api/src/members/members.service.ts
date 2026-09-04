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
              u.full_name, u.username, u.phone, u.preferred_language, u.must_change_password,
              rna.range_start, rna.range_end, rna.current_number
       FROM mandal_members mm
       JOIN users u ON u.id = mm.user_id
       LEFT JOIN receipt_number_allocations rna ON rna.mandal_id = mm.mandal_id AND rna.user_id = mm.user_id
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

      // 1. Determine or generate unique username
      let username = (input.username || '').trim().toLowerCase().replace(/\s+/g, '_');
      if (!username) {
        // Derive from full name
        const base = input.full_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '') || 'member';
        username = base;

        // Check if taken, append random number if collision
        const checkRes = await client.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
        if (checkRes.rowCount && checkRes.rowCount > 0) {
          username = `${base}_${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      // 2. Find or create user
      let user: any = null;
      if (input.phone && input.phone.trim()) {
        const phoneCheck = await client.query(`SELECT * FROM users WHERE phone = $1`, [input.phone.trim()]);
        if (phoneCheck.rowCount && phoneCheck.rowCount > 0) {
          user = phoneCheck.rows[0];
          // Update username and full_name if not set
          await client.query(
            `UPDATE users 
             SET username = COALESCE(username, $1), 
                 full_name = $2, 
                 password_hash = COALESCE(password_hash, $3),
                 updated_at = NOW() 
             WHERE id = $4`,
            [username, input.full_name.trim(), DEFAULT_PASSWORD_HASH, user.id]
          );
          user.username = user.username || username;
          user.full_name = input.full_name.trim();
        }
      }

      if (!user) {
        const userByUname = await client.query(`SELECT * FROM users WHERE LOWER(username) = LOWER($1)`, [username]);
        if (userByUname.rowCount && userByUname.rowCount > 0) {
          user = userByUname.rows[0];
        } else {
          const newUserRes = await client.query(
            `INSERT INTO users (username, phone, full_name, password_hash, must_change_password)
             VALUES ($1, $2, $3, $4, TRUE)
             RETURNING *`,
            [username, input.phone?.trim() || null, input.full_name.trim(), DEFAULT_PASSWORD_HASH]
          );
          user = newUserRes.rows[0];
        }
      }

      // 3. Add or update mandal member
      const memberRes = await client.query(
        `INSERT INTO mandal_members (mandal_id, user_id, role, status, invited_by)
         VALUES ($1, $2, $3, 'ACTIVE', $4)
         ON CONFLICT (mandal_id, user_id) 
         DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE', updated_at = NOW()
         RETURNING *`,
        [input.mandal_id, user.id, input.role, inviterId]
      );

      // 4. If volunteer, allocate receipt block if not already allocated
      if (input.role === Role.VOLUNTEER) {
        const existingRange = await client.query(
          `SELECT * FROM receipt_number_allocations WHERE mandal_id = $1 AND user_id = $2`,
          [input.mandal_id, user.id]
        );

        if (existingRange.rowCount === 0) {
          const maxRes = await client.query(
            `SELECT COALESCE(MAX(range_end), 0) as max_end FROM receipt_number_allocations WHERE mandal_id = $1`,
            [input.mandal_id]
          );
          const start = parseInt(maxRes.rows[0].max_end, 10) + 1;
          const end = start + 499; // 500-receipt block

          await client.query(
            `INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
             VALUES ($1, $2, $3, $4, $3)`,
            [input.mandal_id, user.id, start, end]
          );
        }
      }

      const loginUrl = 'https://digital-vargani-mu.vercel.app/login';
      const shareableMessage = `🚩 *${mandalName} - डिजिटल वर्गणी लॉगिन माहिती*\n\nनमस्कार ${input.full_name},\nआपणांस डिजिटल वर्गणी प्रणालीमध्ये *${input.role}* म्हणून समाविष्ट करण्यात आले आहे.\n\n🔗 *लॉगिन लिंक:* ${loginUrl}\n👤 *युझरनेम (Username):* ${user.username}\n🔑 *पासवर्ड (Password):* ${DEFAULT_PASSWORD}\n\n⚠️ पहिल्या लॉगिननंतर कृपया आपला पासवर्ड बदलून घ्या.`;

      return {
        member: memberRes.rows[0],
        user: {
          id: user.id,
          username: user.username,
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
