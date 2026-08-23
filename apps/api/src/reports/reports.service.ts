import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class ReportsService {
  constructor(private db: DbService) {}

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
      `"${row.receipt_number}"`,
      `"${row.donor_name.replace(/"/g, '""')}"`,
      `"${row.donor_phone || ''}"`,
      row.amount,
      row.payment_mode,
      `"${row.payment_reference || ''}"`,
      `"${row.flat_wing || ''}"`,
      `"${row.volunteer_name}"`,
      row.is_reconciled ? 'YES' : 'NO',
      `"${new Date(row.created_at).toLocaleString('en-IN')}"`,
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
      row.category,
      row.amount,
      `"${row.description.replace(/"/g, '""')}"`,
      row.status,
      `"${row.logged_by_name}"`,
      `"${row.approved_by_name || ''}"`,
      `"${row.approved_at ? new Date(row.approved_at).toLocaleString('en-IN') : ''}"`,
      `"${new Date(row.created_at).toLocaleString('en-IN')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
