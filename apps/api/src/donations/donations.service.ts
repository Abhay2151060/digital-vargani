import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import {
  CreateDonationInput,
  SyncDonationsBatchInput,
  CreateCorrectionInput,
  VoidDonationInput,
  PaymentMode,
  PaymentVerificationStatus,
} from '@vargani/types';

@Injectable()
export class DonationsService {
  constructor(private db: DbService) {}

  async createDonation(volunteerId: string, input: CreateDonationInput) {
    return await this.db.withTransaction(async (client) => {
      // 1. Get mandal prefix
      const mandalRes = await client.query(
        `SELECT receipt_prefix FROM mandals WHERE id = $1`,
        [input.mandal_id]
      );
      if (mandalRes.rowCount === 0) {
        throw new NotFoundException({ code: 'MANDAL_NOT_FOUND', message: 'Mandal not found' });
      }
      const prefix = mandalRes.rows[0].receipt_prefix;

      let receiptNumber = input.receipt_number;

      // 2. If receipt number not provided (online direct flow), allocate next from volunteer's range
      if (!receiptNumber) {
        const allocRes = await client.query(
          `SELECT id, range_start, range_end, current_number 
           FROM receipt_number_allocations 
           WHERE mandal_id = $1 AND user_id = $2
           FOR UPDATE`,
          [input.mandal_id, volunteerId]
        );

        if (allocRes.rowCount === 0) {
          // Auto-allocate initial range if missing
          const maxRes = await client.query(
            `SELECT COALESCE(MAX(range_end), 0) as max_end FROM receipt_number_allocations WHERE mandal_id = $1`,
            [input.mandal_id]
          );
          const start = parseInt(maxRes.rows[0].max_end, 10) + 1;
          const end = start + 499;

          await client.query(
            `INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
             VALUES ($1, $2, $3, $4, $3 + 1)`,
            [input.mandal_id, volunteerId, start, end]
          );

          receiptNumber = `${prefix}-${String(start).padStart(3, '0')}`;
        } else {
          const alloc = allocRes.rows[0];
          let currentNum = alloc.current_number;

          if (currentNum > alloc.range_end) {
            // Automatically allocate next 500-receipt block when current block is exhausted
            const maxRes = await client.query(
              `SELECT COALESCE(MAX(range_end), 0) as max_end FROM receipt_number_allocations WHERE mandal_id = $1`,
              [input.mandal_id]
            );
            const start = parseInt(maxRes.rows[0].max_end, 10) + 1;
            const end = start + 499;

            await client.query(
              `UPDATE receipt_number_allocations
               SET range_start = $1, range_end = $2, current_number = $1 + 1
               WHERE id = $3`,
              [start, end, alloc.id]
            );

            receiptNumber = `${prefix}-${String(start).padStart(3, '0')}`;
          } else {
            receiptNumber = `${prefix}-${String(currentNum).padStart(3, '0')}`;

            await client.query(
              `UPDATE receipt_number_allocations
               SET current_number = current_number + 1
               WHERE id = $1`,
              [alloc.id]
            );
          }
        }
      }

      // 3. Determine verification status
      const verificationStatus =
        input.payment_mode === PaymentMode.CASH
          ? PaymentVerificationStatus.NOT_REQUIRED
          : input.payment_reference
          ? PaymentVerificationStatus.VERIFIED
          : PaymentVerificationStatus.PENDING_VERIFICATION;

      // 4. Insert donation record (idempotent if client_id provided)
      const donationRes = await client.query(
        `INSERT INTO donations (
          mandal_id, volunteer_id, receipt_number, donor_name, donor_phone,
          amount, payment_mode, payment_reference, flat_wing, language,
          payment_verification_status, client_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (mandal_id, client_id) DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [
          input.mandal_id,
          volunteerId,
          receiptNumber,
          input.donor_name,
          input.donor_phone || null,
          input.amount,
          input.payment_mode,
          input.payment_reference || null,
          input.flat_wing || null,
          input.language,
          verificationStatus,
          input.client_id || null,
        ]
      );

      return donationRes.rows[0];
    }, [input.mandal_id]);
  }

  async syncBatch(volunteerId: string, input: SyncDonationsBatchInput) {
    const results: { client_id: string; receipt_number: string; status: string; error?: string }[] = [];

    for (const item of input.donations) {
      try {
        const donation = await this.createDonation(volunteerId, {
          ...item,
          mandal_id: input.mandal_id,
        });
        results.push({
          client_id: item.client_id,
          receipt_number: donation.receipt_number,
          status: 'SYNCED',
        });
      } catch (err: any) {
        results.push({
          client_id: item.client_id,
          receipt_number: item.receipt_number,
          status: 'FAILED',
          error: err?.message || 'Sync failed',
        });
      }
    }

    return results;
  }

  async getVolunteerAllocations(mandalId: string, volunteerId: string) {
    const res = await this.db.query(
      `SELECT rna.*, m.receipt_prefix
       FROM receipt_number_allocations rna
       JOIN mandals m ON m.id = rna.mandal_id
       WHERE rna.mandal_id = $1 AND rna.user_id = $2`,
      [mandalId, volunteerId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      // Create initial allocation
      return await this.db.withTransaction(async (client) => {
        const mandalRes = await client.query(`SELECT receipt_prefix FROM mandals WHERE id = $1`, [mandalId]);
        const prefix = mandalRes.rows[0].receipt_prefix;

        const maxRes = await client.query(
          `SELECT COALESCE(MAX(range_end), 0) as max_end FROM receipt_number_allocations WHERE mandal_id = $1`,
          [mandalId]
        );
        const start = parseInt(maxRes.rows[0].max_end, 10) + 1;
        const end = start + 499;

        const newAlloc = await client.query(
          `INSERT INTO receipt_number_allocations (mandal_id, user_id, range_start, range_end, current_number)
           VALUES ($1, $2, $3, $4, $3)
           RETURNING *`,
          [mandalId, volunteerId, start, end]
        );

        return {
          ...newAlloc.rows[0],
          receipt_prefix: prefix,
        };
      }, [mandalId]);
    }

    return res.rows[0];
  }

  async listDonations(mandalId: string, filters: { volunteerId?: string; limit?: number; offset?: number }) {
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    let queryStr = `
      SELECT d.*, u.full_name as volunteer_name
      FROM donations d
      JOIN users u ON u.id = d.volunteer_id
      WHERE d.mandal_id = $1
    `;
    const params: any[] = [mandalId];

    if (filters.volunteerId) {
      params.push(filters.volunteerId);
      queryStr += ` AND d.volunteer_id = $${params.length}`;
    }

    params.push(limit, offset);
    queryStr += ` ORDER BY d.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await this.db.query(queryStr, params, [mandalId]);
    return res.rows;
  }

  async getDonationById(mandalId: string, donationId: string) {
    const res = await this.db.query(
      `SELECT d.*, u.full_name as volunteer_name, m.name as mandal_name, m.receipt_prefix, m.logo_url, m.registration_number
       FROM donations d
       JOIN users u ON u.id = d.volunteer_id
       JOIN mandals m ON m.id = d.mandal_id
       WHERE d.id = $1 AND d.mandal_id = $2`,
      [donationId, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'DONATION_NOT_FOUND', message: 'Donation record not found' });
    }

    // Fetch any corrections
    const correctionsRes = await this.db.query(
      `SELECT dc.*, u.full_name as corrected_by_name
       FROM donation_corrections dc
       JOIN users u ON u.id = dc.corrected_by
       WHERE dc.donation_id = $1
       ORDER BY dc.created_at DESC`,
      [donationId],
      [mandalId]
    );

    return {
      ...res.rows[0],
      corrections: correctionsRes.rows,
    };
  }

  async getReceiptByNumber(mandalSlug: string, receiptNumber: string) {
    const res = await this.db.query(
      `SELECT d.id, d.mandal_id, d.receipt_number, d.donor_name, d.amount, d.payment_mode, d.flat_wing, d.language, d.created_at, d.is_voided,
              m.name as mandal_name, m.slug as mandal_slug, m.city, m.area, m.registration_number, m.logo_url, m.hide_phone_numbers,
              u.full_name as volunteer_name, d.donor_phone
       FROM donations d
       JOIN mandals m ON m.id = d.mandal_id
       JOIN users u ON u.id = d.volunteer_id
       WHERE m.slug = $1 AND d.receipt_number = $2 AND d.is_voided = FALSE`,
      [mandalSlug, receiptNumber]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found or invalid' });
    }

    const row = res.rows[0];
    const maskedPhone = row.donor_phone
      ? row.hide_phone_numbers
        ? `${row.donor_phone.substring(0, 5)}*****`
        : row.donor_phone
      : null;

    return {
      ...row,
      donor_phone: maskedPhone,
    };
  }

  async getReceiptByNumberOnly(receiptNumber: string) {
    const res = await this.db.query(
      `SELECT d.id, d.mandal_id, d.receipt_number, d.donor_name, d.amount, d.payment_mode, d.flat_wing, d.language, d.created_at, d.is_voided,
              m.name as mandal_name, m.slug as mandal_slug, m.city, m.area, m.registration_number, m.logo_url, m.hide_phone_numbers,
              u.full_name as volunteer_name, d.donor_phone
       FROM donations d
       JOIN mandals m ON m.id = d.mandal_id
       JOIN users u ON u.id = d.volunteer_id
       WHERE d.receipt_number = $1 AND d.is_voided = FALSE`,
      [receiptNumber]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found or invalid' });
    }

    const row = res.rows[0];
    const maskedPhone = row.donor_phone
      ? row.hide_phone_numbers
        ? `${row.donor_phone.substring(0, 5)}*****`
        : row.donor_phone
      : null;

    return {
      ...row,
      donor_phone: maskedPhone,
    };
  }

  async correctDonation(userId: string, input: CreateCorrectionInput) {
    // First retrieve donation to get mandal_id
    const findRes = await this.db.query(`SELECT mandal_id FROM donations WHERE id = $1`, [input.donation_id]);
    if (findRes.rowCount === 0) {
      throw new NotFoundException({ code: 'DONATION_NOT_FOUND', message: 'Donation not found' });
    }
    const mandalId = findRes.rows[0].mandal_id;

    return await this.db.withTransaction(async (client) => {
      const donRes = await client.query(
        `SELECT * FROM donations WHERE id = $1 FOR UPDATE`,
        [input.donation_id]
      );
      if (donRes.rowCount === 0) {
        throw new NotFoundException({ code: 'DONATION_NOT_FOUND', message: 'Donation not found' });
      }
      const donation = donRes.rows[0];

      if (donation.is_voided) {
        throw new BadRequestException({ code: 'DONATION_VOIDED', message: 'Cannot edit a voided donation' });
      }

      if (donation.is_reconciled) {
        throw new BadRequestException({
          code: 'DONATION_RECONCILED',
          message: 'Donation has already been reconciled with Treasurer. Please report as discrepancy.',
        });
      }

      // Record in immutable corrections ledger
      await client.query(
        `INSERT INTO donation_corrections (donation_id, mandal_id, corrected_by, previous_amount, new_amount, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [donation.id, donation.mandal_id, userId, donation.amount, input.new_amount, input.reason]
      );

      // Update donation amount
      const updatedDonation = await client.query(
        `UPDATE donations SET amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [input.new_amount, donation.id]
      );

      return updatedDonation.rows[0];
    }, [mandalId]);
  }

  async voidDonation(userId: string, input: VoidDonationInput) {
    const findRes = await this.db.query(`SELECT mandal_id FROM donations WHERE id = $1`, [input.donation_id]);
    if (findRes.rowCount === 0) {
      throw new NotFoundException({ code: 'DONATION_NOT_FOUND', message: 'Donation not found' });
    }
    const mandalId = findRes.rows[0].mandal_id;

    return await this.db.withTransaction(async (client) => {
      const donRes = await client.query(
        `SELECT * FROM donations WHERE id = $1 FOR UPDATE`,
        [input.donation_id]
      );
      if (donRes.rowCount === 0) {
        throw new NotFoundException({ code: 'DONATION_NOT_FOUND', message: 'Donation not found' });
      }
      const donation = donRes.rows[0];

      if (donation.is_voided) {
        return donation;
      }

      if (donation.is_reconciled) {
        throw new BadRequestException({
          code: 'DONATION_RECONCILED',
          message: 'Cannot void already reconciled donation.',
        });
      }

      const res = await client.query(
        `UPDATE donations 
         SET is_voided = TRUE, voided_by = $1, voided_reason = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [userId, input.reason, donation.id]
      );

      return res.rows[0];
    }, [mandalId]);
  }
}
