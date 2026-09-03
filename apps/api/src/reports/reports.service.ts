import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class ReportsService {
  constructor(private db: DbService) {}

  private escapeCsvValue(value: unknown): string {
    const text = String(value ?? '');
    const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${neutralized.replace(/"/g, '""')}"`;
  }

  async exportDonationsCsv(mandalId: string): Promise<string> {
    const res = await this.db.query(
      `SELECT d.receipt_number, d.donor_name, d.donor_phone, d.amount, d.payment_mode, 
              d.payment_reference, d.flat_wing, d.is_reconciled, d.created_at, u.full_name as volunteer_name
       FROM donations d
       JOIN users u ON u.id = d.volunteer_id
       WHERE d.mandal_id = $1 AND d.is_voided = FALSE
       ORDER BY d.created_at ASC`,
      [mandalId],
      [mandalId]
    );

    const headers = [
      'Receipt Number',
      'Donor Name',
      'Phone',
      'Amount (INR)',
      'Payment Mode',
      'Reference',
      'Flat/Wing',
      'Volunteer',
      'Reconciled',
      'Date & Time',
    ];

    const rows = res.rows.map((row) => [
      this.escapeCsvValue(row.receipt_number),
      this.escapeCsvValue(row.donor_name),
      this.escapeCsvValue(row.donor_phone),
      this.escapeCsvValue(row.amount),
      this.escapeCsvValue(row.payment_mode),
      this.escapeCsvValue(row.payment_reference),
      this.escapeCsvValue(row.flat_wing),
      this.escapeCsvValue(row.volunteer_name),
      this.escapeCsvValue(row.is_reconciled ? 'YES' : 'NO'),
      this.escapeCsvValue(new Date(row.created_at).toLocaleString('en-IN')),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportExpensesCsv(mandalId: string): Promise<string> {
    const res = await this.db.query(
      `SELECT e.category, e.amount, e.description, e.status, e.created_at, 
              u.full_name as logged_by_name, a.full_name as approved_by_name, e.approved_at
       FROM expenses e
       JOIN users u ON u.id = e.logged_by
       LEFT JOIN users a ON a.id = e.approved_by
       WHERE e.mandal_id = $1 AND e.is_voided = FALSE
       ORDER BY e.created_at ASC`,
      [mandalId],
      [mandalId]
    );

    const headers = [
      'Category',
      'Amount (INR)',
      'Description',
      'Status',
      'Logged By',
      'Approved By',
      'Approved Date',
      'Created Date',
    ];

    const rows = res.rows.map((row) => [
      this.escapeCsvValue(row.category),
      this.escapeCsvValue(row.amount),
      this.escapeCsvValue(row.description),
      this.escapeCsvValue(row.status),
      this.escapeCsvValue(row.logged_by_name),
      this.escapeCsvValue(row.approved_by_name),
      this.escapeCsvValue(row.approved_at ? new Date(row.approved_at).toLocaleString('en-IN') : ''),
      this.escapeCsvValue(new Date(row.created_at).toLocaleString('en-IN')),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
