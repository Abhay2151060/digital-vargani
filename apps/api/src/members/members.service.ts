import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { InviteMemberInput, Role, MemberStatus } from '@vargani/types';

@Injectable()
export class MembersService {
  constructor(private db: DbService) {}

  async listMembers(mandalId: string) {
    const res = await this.db.query(
      `SELECT mm.id, mm.mandal_id, mm.user_id, mm.role, mm.status, mm.created_at,
              u.full_name, u.phone, u.preferred_language,
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
      // 1. Find or create user
      const userRes = await client.query(`SELECT * FROM users WHERE phone = $1`, [input.phone]);
      let user = userRes.rows[0];

      if (!user) {
        const newUserRes = await client.query(
          `INSERT INTO users (phone, full_name) VALUES ($1, $2) RETURNING *`,
          [input.phone, input.full_name]
        );
        user = newUserRes.rows[0];
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

      // 3. If volunteer, allocate receipt block if not already allocated
      if (input.role === Role.VOLUNTEER) {
        const existingRange = await client.query(
          `SELECT * FROM receipt_number_allocations WHERE mandal_id = $1 AND user_id = $2`,
          [input.mandal_id, user.id]
        );

        if (existingRange.rowCount === 0) {
          // Find max range_end
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

      return {
        member: memberRes.rows[0],
        user,
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
