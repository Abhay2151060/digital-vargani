import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UpdateMandalProfileInput, FestivalType } from '@vargani/types';

@Injectable()
export class MandalsService {
  constructor(private db: DbService) {}

  async getMandalById(mandalId: string) {
    const res = await this.db.query(
      `SELECT * FROM mandals WHERE id = $1`,
      [mandalId],
      [mandalId]
    );
    if (res.rowCount === 0) {
      throw new NotFoundException({
        code: 'MANDAL_NOT_FOUND',
        message: 'Mandal not found',
      });
    }
    return res.rows[0];
  }

  async getMandalBySlug(slug: string) {
    const res = await this.db.query(
      `SELECT * FROM mandals WHERE slug = $1 AND is_active = TRUE`,
      [slug]
    );
    if (res.rowCount === 0) {
      throw new NotFoundException({
        code: 'MANDAL_NOT_FOUND',
        message: 'Mandal not found with given slug',
      });
    }
    return res.rows[0];
  }

  async updateMandal(mandalId: string, input: UpdateMandalProfileInput) {
    const res = await this.db.query(
      `UPDATE mandals 
       SET name = $1, registration_number = $2, city = $3, area = $4, 
           festival_type = $5, receipt_prefix = $6, logo_url = $7, upi_id = $8, 
           preset_amounts = $9, hide_phone_numbers = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        input.name,
        input.registration_number,
        input.city,
        input.area,
        input.festival_type,
        input.receipt_prefix,
        input.logo_url,
        input.upi_id,
        input.preset_amounts,
        input.hide_phone_numbers,
        mandalId,
      ],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'MANDAL_NOT_FOUND', message: 'Mandal not found' });
    }
    return res.rows[0];
  }

  async createMandal(userId: string, input: { name: string; city: string; festival_type: FestivalType }) {
    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    return await this.db.withTransaction(async (client) => {
      const mandalRes = await client.query(
        `INSERT INTO mandals (name, slug, city, festival_type, receipt_prefix)
         VALUES ($1, $2, $3, $4, 'G')
         RETURNING *`,
        [input.name, slug, input.city, input.festival_type]
      );
      const mandal = mandalRes.rows[0];

      // Add creating user as ADMIN
      await client.query(
        `INSERT INTO mandal_members (mandal_id, user_id, role, status)
         VALUES ($1, $2, 'ADMIN', 'ACTIVE')`,
        [mandal.id, userId]
      );

      // Allocate initial receipt number range
      await client.query(
        `INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
         VALUES ($1, $2, 1, 500, 1)`,
        [mandal.id, userId]
      );

      return mandal;
    });
  }
}
