import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { PublicTransparencyReport, PaymentMode, ExpenseCategory } from '@vargani/types';

@Injectable()
export class TransparencyService {
  constructor(private db: DbService) {}

  async getTransparencyReport(slug: string): Promise<PublicTransparencyReport> {
    // 1. Fetch mandal profile
    const mandalRes = await this.db.query(
      `SELECT id, name, slug, registration_number, city, area, festival_type, logo_url, upi_id, upi_qr_url, ahwal_url, ahwal_title, hide_phone_numbers
       FROM mandals
       WHERE slug = $1 AND is_active = TRUE`,
      [slug]
    );

    if (mandalRes.rowCount === 0) {
      throw new NotFoundException({
        code: 'MANDAL_NOT_FOUND',
        message: 'Public transparency page not found for this mandal',
      });
    }

    const mandal = mandalRes.rows[0];

    // 2. Fetch approved collections totals & breakdown
    const collectionsRes = await this.db.query(
      `SELECT 
         payment_mode,
         COALESCE(SUM(amount), 0) as total_amount,
         COUNT(*) as count
       FROM donations
       WHERE mandal_id = $1 AND is_voided = FALSE
       GROUP BY payment_mode`,
      [mandal.id]
    );

    // 3. Fetch approved expenses breakdown
    const expensesRes = await this.db.query(
      `SELECT 
         category,
         COALESCE(SUM(amount), 0) as total_amount,
         COUNT(*) as count
       FROM expenses
       WHERE mandal_id = $1 AND status = 'APPROVED' AND is_voided = FALSE
       GROUP BY category`,
      [mandal.id]
    );

    // 4. Fetch donor roll (latest 100 donations)
    const donorRollRes = await this.db.query(
      `SELECT receipt_number, donor_name, donor_phone, amount, payment_mode, created_at
       FROM donations
       WHERE mandal_id = $1 AND is_voided = FALSE
       ORDER BY created_at DESC
       LIMIT 100`,
      [mandal.id]
    );

    // 5. Fetch approved expenses list
    const expenseListRes = await this.db.query(
      `SELECT id, category, amount, description, bill_photo_url, created_at
       FROM expenses
       WHERE mandal_id = $1 AND status = 'APPROVED' AND is_voided = FALSE
       ORDER BY created_at DESC`,
      [mandal.id]
    );

    const totalCollected = collectionsRes.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount),
      0
    );
    const totalExpenses = expensesRes.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount),
      0
    );
    const totalDonorsCount = collectionsRes.rows.reduce(
      (sum, row) => sum + parseInt(row.count, 10),
      0
    );

    return {
      mandal: {
        name: mandal.name,
        slug: mandal.slug,
        registration_number: mandal.registration_number,
        city: mandal.city,
        area: mandal.area,
        festival_type: mandal.festival_type,
        logo_url: mandal.logo_url,
        upi_id: mandal.upi_id,
        upi_qr_url: mandal.upi_qr_url,
        ahwal_url: mandal.ahwal_url,
        ahwal_title: mandal.ahwal_title,
        hide_phone_numbers: mandal.hide_phone_numbers,
      },
      total_collected: totalCollected,
      total_expenses: totalExpenses,
      net_balance: totalCollected - totalExpenses,
      total_donors_count: totalDonorsCount,
      collections_by_mode: collectionsRes.rows.map((r) => ({
        mode: r.payment_mode as PaymentMode,
        amount: parseFloat(r.total_amount),
        count: parseInt(r.count, 10),
      })),
      expenses_by_category: expensesRes.rows.map((r) => ({
        category: r.category as ExpenseCategory,
        amount: parseFloat(r.total_amount),
        count: parseInt(r.count, 10),
      })),
      donor_roll: donorRollRes.rows.map((d) => {
        let maskedPhone: string | undefined = undefined;
        if (d.donor_phone) {
          maskedPhone = mandal.hide_phone_numbers
            ? `${d.donor_phone.substring(0, 5)}*****`
            : d.donor_phone;
        }
        return {
          receipt_number: d.receipt_number,
          donor_name: d.donor_name,
          donor_phone_masked: maskedPhone,
          amount: parseFloat(d.amount),
          payment_mode: d.payment_mode as PaymentMode,
          created_at: d.created_at,
        };
      }),
      approved_expenses_list: expenseListRes.rows.map((e) => ({
        id: e.id,
        category: e.category as ExpenseCategory,
        amount: parseFloat(e.amount),
        description: e.description,
        bill_photo_url: e.bill_photo_url,
        created_at: e.created_at,
      })),
      is_audited: true,
      audited_at: new Date().toISOString(),
    };
  }
}
