import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateReconciliationInput, DiscrepancyStatus, TreasurerOverview } from '@vargani/types';

@Injectable()
export class ReconciliationService {
  constructor(private db: DbService) {}

  async getVolunteerCashSummary(mandalId: string, volunteerId: string) {
    const res = await this.db.query(
      `SELECT 
         COUNT(*) as donation_count,
         COALESCE(SUM(amount), 0) as expected_cash_amount
       FROM donations
       WHERE mandal_id = $1 
         AND volunteer_id = $2 
         AND payment_mode = 'CASH' 
         AND is_reconciled = FALSE 
         AND is_voided = FALSE`,
      [mandalId, volunteerId],
      [mandalId]
    );

    const row = res.rows[0];
    return {
      donation_count: parseInt(row.donation_count, 10),
      expected_cash_amount: parseFloat(row.expected_cash_amount),
    };
  }

  async reconcileCash(treasurerId: string, input: CreateReconciliationInput) {
    return await this.db.withTransaction(async (client) => {
      // 1. Lock and fetch all unreconciled cash donations for this volunteer
      const donationsRes = await client.query(
        `SELECT id, amount 
         FROM donations
         WHERE mandal_id = $1 
           AND volunteer_id = $2 
           AND payment_mode = 'CASH' 
           AND is_reconciled = FALSE 
           AND is_voided = FALSE
         FOR UPDATE`,
        [input.mandal_id, input.volunteer_id]
      );

      const donations = donationsRes.rows;
      if (donations.length === 0) {
        throw new BadRequestException({
          code: 'NO_UNRECONCILED_DONATIONS',
          message: 'No pending cash donations found for this volunteer to reconcile.',
        });
      }

      const expectedAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const receivedAmount = input.received_amount;
      const discrepancy = receivedAmount - expectedAmount;

      let discrepancyStatus = DiscrepancyStatus.NONE;
      if (Math.abs(discrepancy) > 0.001) {
        discrepancyStatus = DiscrepancyStatus.OPEN;
      }

      // 2. Create reconciliation record
      const recRes = await client.query(
        `INSERT INTO cash_reconciliations (
           mandal_id, volunteer_id, treasurer_id, expected_amount, received_amount,
           discrepancy_status, discrepancy_reason, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          input.mandal_id,
          input.volunteer_id,
          treasurerId,
          expectedAmount,
          receivedAmount,
          discrepancyStatus,
          input.discrepancy_reason || null,
          input.notes || null,
        ]
      );

      const reconciliation = recRes.rows[0];

      // 3. Mark donations as reconciled and link to this reconciliation
      const donationIds = donations.map((d) => d.id);
      await client.query(
        `UPDATE donations 
         SET is_reconciled = TRUE, reconciliation_id = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [reconciliation.id, donationIds]
      );

      return {
        ...reconciliation,
        reconciled_donations_count: donations.length,
      };
    }, [input.mandal_id]);
  }

  async resolveDiscrepancy(
    mandalId: string,
    reconciliationId: string,
    status: DiscrepancyStatus,
    notes?: string
  ) {
    const res = await this.db.query(
      `UPDATE cash_reconciliations
       SET discrepancy_status = $1, resolved_at = NOW(), notes = COALESCE($2, notes)
       WHERE id = $3 AND mandal_id = $4
       RETURNING *`,
      [status, notes || null, reconciliationId, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({
        code: 'RECONCILIATION_NOT_FOUND',
        message: 'Reconciliation record not found',
      });
    }

    return res.rows[0];
  }

  async listReconciliations(mandalId: string) {
    const res = await this.db.query(
      `SELECT cr.*, 
              v.full_name as volunteer_name, v.phone as volunteer_phone,
              t.full_name as treasurer_name
       FROM cash_reconciliations cr
       JOIN users v ON v.id = cr.volunteer_id
       JOIN users t ON t.id = cr.treasurer_id
       WHERE cr.mandal_id = $1
       ORDER BY cr.created_at DESC`,
      [mandalId],
      [mandalId]
    );
    return res.rows;
  }

  async getTreasurerOverview(mandalId: string): Promise<TreasurerOverview> {
    // 1. Collections totals
    const totalsRes = await this.db.query(
      `SELECT 
         COALESCE(SUM(amount), 0) as total_collected,
         COALESCE(SUM(CASE WHEN created_at::DATE = CURRENT_DATE THEN amount ELSE 0 END), 0) as today_collected,
         COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount ELSE 0 END), 0) as cash_collected,
         COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN amount ELSE 0 END), 0) as upi_collected,
         COALESCE(SUM(CASE WHEN payment_mode = 'PENDING' THEN amount ELSE 0 END), 0) as pending_collected,
         COALESCE(SUM(CASE WHEN payment_mode = 'CASH' AND is_reconciled = FALSE THEN amount ELSE 0 END), 0) as cash_in_hand_volunteers,
         COALESCE(SUM(CASE WHEN payment_mode = 'CASH' AND is_reconciled = TRUE THEN amount ELSE 0 END), 0) as cash_reconciled
       FROM donations
       WHERE mandal_id = $1 AND is_voided = FALSE`,
      [mandalId],
      [mandalId]
    );

    // 2. Expenses totals
    const expensesRes = await this.db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END), 0) as approved_expenses,
         COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_expenses
       FROM expenses
       WHERE mandal_id = $1 AND is_voided = FALSE`,
      [mandalId],
      [mandalId]
    );

    // 3. Volunteer tallies
    const volunteerTalliesRes = await this.db.query(
      `SELECT 
         u.id as volunteer_id,
         u.full_name as volunteer_name,
         COALESCE(SUM(CASE WHEN d.payment_mode = 'CASH' AND d.created_at::DATE = CURRENT_DATE AND d.is_voided = FALSE THEN d.amount ELSE 0 END), 0) as today_cash_collected,
         COALESCE(SUM(CASE WHEN d.payment_mode = 'UPI' AND d.created_at::DATE = CURRENT_DATE AND d.is_voided = FALSE THEN d.amount ELSE 0 END), 0) as today_upi_collected,
         COALESCE(SUM(CASE WHEN d.payment_mode = 'PENDING' AND d.created_at::DATE = CURRENT_DATE AND d.is_voided = FALSE THEN d.amount ELSE 0 END), 0) as today_pending_collected,
         COALESCE(SUM(CASE WHEN d.payment_mode = 'CASH' AND d.is_reconciled = FALSE AND d.is_voided = FALSE THEN d.amount ELSE 0 END), 0) as total_cash_unreconciled,
         COUNT(d.id) FILTER (WHERE d.is_voided = FALSE) as total_donations_count
       FROM mandal_members mm
       JOIN users u ON u.id = mm.user_id
       LEFT JOIN donations d ON d.volunteer_id = u.id AND d.mandal_id = mm.mandal_id
       WHERE mm.mandal_id = $1 AND mm.status = 'ACTIVE'
       GROUP BY u.id, u.full_name
       ORDER BY total_cash_unreconciled DESC, u.full_name ASC`,
      [mandalId],
      [mandalId]
    );

    // 4. Recent reconciliations
    const recList = await this.listReconciliations(mandalId);

    const totals = totalsRes.rows[0];
    const expenses = expensesRes.rows[0];

    const totalCollected = parseFloat(totals.total_collected);
    const approvedExpenses = parseFloat(expenses.approved_expenses);

    return {
      mandal_id: mandalId,
      festival_total_collected: totalCollected,
      today_total_collected: parseFloat(totals.today_collected),
      total_cash_collected: parseFloat(totals.cash_collected),
      total_upi_collected: parseFloat(totals.upi_collected),
      total_pending_collected: parseFloat(totals.pending_collected),
      total_cash_in_hand_volunteers: parseFloat(totals.cash_in_hand_volunteers),
      total_cash_reconciled: parseFloat(totals.cash_reconciled),
      total_approved_expenses: approvedExpenses,
      total_pending_expenses: parseFloat(expenses.pending_expenses),
      net_balance: totalCollected - approvedExpenses,
      volunteer_tallies: volunteerTalliesRes.rows.map((v) => ({
        volunteer_id: v.volunteer_id,
        volunteer_name: v.volunteer_name,
        today_cash_collected: parseFloat(v.today_cash_collected),
        today_upi_collected: parseFloat(v.today_upi_collected),
        today_pending_collected: parseFloat(v.today_pending_collected),
        total_cash_unreconciled: parseFloat(v.total_cash_unreconciled),
        total_donations_count: parseInt(v.total_donations_count, 10),
      })),
      recent_reconciliations: recList.slice(0, 10),
    };
  }
}
