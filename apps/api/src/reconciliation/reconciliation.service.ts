import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateReconciliationInput, DiscrepancyStatus, TreasurerOverview } from '@vargani/types';

@Injectable()
export class ReconciliationService {
  constructor(private db: DbService) {}

  async getVolunteerCashSummary(mandalId: string, volunteerId: string) {
    const res = await this.db.query(
      `SELECT 
         COUNT(DISTINCT dp.id) as payment_count,
         COUNT(DISTINCT dp.donation_id) as donation_count,
         COALESCE(SUM(dp.amount), 0) as expected_cash_amount
       FROM donation_payments dp
       JOIN donations d ON d.id = dp.donation_id
       WHERE dp.mandal_id = $1 
         AND dp.collected_by = $2 
         AND dp.payment_mode = 'CASH' 
         AND dp.is_reconciled = FALSE 
         AND d.is_voided = FALSE`,
      [mandalId, volunteerId],
      [mandalId]
    );

    const row = res.rows[0];
    return {
      donation_count: parseInt(row.donation_count || row.payment_count || 0, 10),
      expected_cash_amount: parseFloat(row.expected_cash_amount || 0),
    };
  }

  async reconcileCash(treasurerId: string, input: CreateReconciliationInput) {
    return await this.db.withTransaction(async (client) => {
      // 1. Lock and fetch all unreconciled cash payments for this volunteer
      const paymentsRes = await client.query(
        `SELECT dp.id, dp.amount, dp.donation_id
         FROM donation_payments dp
         JOIN donations d ON d.id = dp.donation_id
         WHERE dp.mandal_id = $1 
           AND dp.collected_by = $2 
           AND dp.payment_mode = 'CASH' 
           AND dp.is_reconciled = FALSE 
           AND d.is_voided = FALSE
         FOR UPDATE OF dp`,
        [input.mandal_id, input.volunteer_id]
      );

      const payments = paymentsRes.rows;
      if (payments.length === 0) {
        throw new BadRequestException({
          code: 'NO_UNRECONCILED_DONATIONS',
          message: 'No pending cash collections found for this volunteer to reconcile.',
        });
      }

      const expectedAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
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

      // 3. Mark payments and parent donations as reconciled
      const paymentIds = payments.map((p) => p.id);
      await client.query(
        `UPDATE donation_payments 
         SET is_reconciled = TRUE, reconciliation_id = $1
         WHERE id = ANY($2::uuid[])`,
        [reconciliation.id, paymentIds]
      );

      const donationIds = [...new Set(payments.map((p) => p.donation_id))];
      await client.query(
        `UPDATE donations 
         SET is_reconciled = TRUE, reconciliation_id = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [reconciliation.id, donationIds]
      );

      return {
        ...reconciliation,
        donations_count: payments.length,
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
    // 1. Collections totals from actual payments
    const totalsRes = await this.db.query(
      `SELECT 
         COALESCE(SUM(dp.amount), 0) as total_collected,
         COALESCE(SUM(CASE WHEN dp.created_at::DATE = CURRENT_DATE THEN dp.amount ELSE 0 END), 0) as today_collected,
         COALESCE(SUM(CASE WHEN dp.created_at::DATE = CURRENT_DATE AND dp.payment_mode = 'CASH' THEN dp.amount ELSE 0 END), 0) as today_cash_collected,
         COALESCE(SUM(CASE WHEN dp.created_at::DATE = CURRENT_DATE AND dp.payment_mode = 'UPI' THEN dp.amount ELSE 0 END), 0) as today_upi_collected,
         COALESCE(SUM(CASE WHEN dp.payment_mode = 'CASH' THEN dp.amount ELSE 0 END), 0) as cash_collected,
         COALESCE(SUM(CASE WHEN dp.payment_mode = 'UPI' THEN dp.amount ELSE 0 END), 0) as upi_collected,
         COALESCE(SUM(CASE WHEN dp.payment_mode = 'CASH' AND dp.is_reconciled = FALSE THEN dp.amount ELSE 0 END), 0) as cash_in_hand_volunteers,
         COALESCE(SUM(CASE WHEN dp.payment_mode = 'CASH' AND dp.is_reconciled = TRUE THEN dp.amount ELSE 0 END), 0) as cash_reconciled
       FROM donation_payments dp
       JOIN donations d ON d.id = dp.donation_id
       WHERE dp.mandal_id = $1 AND d.is_voided = FALSE`,
      [mandalId],
      [mandalId]
    );

    // 1b. Pending totals from donations remaining balances
    const pendingTotalsRes = await this.db.query(
      `SELECT 
         COALESCE(SUM(GREATEST(0, d.amount - COALESCE(dp_agg.total_paid, 0))), 0) as pending_collected,
         COALESCE(SUM(CASE WHEN d.created_at::DATE = CURRENT_DATE THEN GREATEST(0, d.amount - COALESCE(dp_agg.total_paid, 0)) ELSE 0 END), 0) as today_pending_collected
       FROM donations d
       LEFT JOIN (
         SELECT donation_id, SUM(amount) as total_paid
         FROM donation_payments
         GROUP BY donation_id
       ) dp_agg ON dp_agg.donation_id = d.id
       WHERE d.mandal_id = $1 AND d.is_voided = FALSE`,
      [mandalId],
      [mandalId]
    );

    // 2. Expenses totals
    const expensesRes = await this.db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END), 0) as approved_expenses,
         COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_expenses,
         COALESCE(SUM(CASE WHEN status = 'APPROVED' AND payment_mode = 'CASH' THEN amount ELSE 0 END), 0) as expenses_paid_cash,
         COALESCE(SUM(CASE WHEN status = 'APPROVED' AND payment_mode = 'UPI' THEN amount ELSE 0 END), 0) as expenses_paid_upi
       FROM expenses
       WHERE mandal_id = $1 AND is_voided = FALSE`,
      [mandalId],
      [mandalId]
    );

    // 3. Volunteer tallies: accurately computed from payments & donations
    const volunteerTalliesRes = await this.db.query(
      `WITH user_payments AS (
         SELECT 
           dp.collected_by as user_id,
           COALESCE(SUM(CASE WHEN dp.payment_mode = 'CASH' AND dp.created_at::DATE = CURRENT_DATE THEN dp.amount ELSE 0 END), 0) as today_cash_collected,
           COALESCE(SUM(CASE WHEN dp.payment_mode = 'UPI' AND dp.created_at::DATE = CURRENT_DATE THEN dp.amount ELSE 0 END), 0) as today_upi_collected,
           COALESCE(SUM(CASE WHEN dp.payment_mode = 'CASH' AND dp.is_reconciled = FALSE THEN dp.amount ELSE 0 END), 0) as total_cash_unreconciled
         FROM donation_payments dp
         JOIN donations d ON d.id = dp.donation_id
         WHERE dp.mandal_id = $1 AND d.is_voided = FALSE
         GROUP BY dp.collected_by
       ),
       user_donations AS (
         SELECT 
           d.volunteer_id as user_id,
           COUNT(d.id) as total_donations_count,
           COALESCE(SUM(CASE WHEN d.created_at::DATE = CURRENT_DATE THEN GREATEST(0, d.amount - COALESCE(dp_agg.total_paid, 0)) ELSE 0 END), 0) as today_pending_collected
         FROM donations d
         LEFT JOIN (
           SELECT donation_id, SUM(amount) as total_paid
           FROM donation_payments
           GROUP BY donation_id
         ) dp_agg ON dp_agg.donation_id = d.id
         WHERE d.mandal_id = $1 AND d.is_voided = FALSE
         GROUP BY d.volunteer_id
       )
       SELECT 
         u.id as volunteer_id,
         u.full_name as volunteer_name,
         COALESCE(up.today_cash_collected, 0) as today_cash_collected,
         COALESCE(up.today_upi_collected, 0) as today_upi_collected,
         COALESCE(ud.today_pending_collected, 0) as today_pending_collected,
         COALESCE(up.total_cash_unreconciled, 0) as total_cash_unreconciled,
         COALESCE(ud.total_donations_count, 0) as total_donations_count
       FROM mandal_members mm
       JOIN users u ON u.id = mm.user_id
       LEFT JOIN user_payments up ON up.user_id = u.id
       LEFT JOIN user_donations ud ON ud.user_id = u.id
       WHERE mm.mandal_id = $1 AND mm.status = 'ACTIVE'
       ORDER BY total_cash_unreconciled DESC, u.full_name ASC`,
      [mandalId],
      [mandalId]
    );

    // 4. Recent reconciliations
    const recList = await this.listReconciliations(mandalId);

    // 5. Recent donations with live totals and payment status
    const recentDonationsRes = await this.db.query(
      `SELECT d.*, 
              u.full_name as volunteer_name,
              COALESCE(dp_agg.total_paid, 0)::numeric as total_paid,
              GREATEST(0, d.amount - COALESCE(dp_agg.total_paid, 0))::numeric as remaining_amount,
              COALESCE(dp_agg.paid_cash, 0)::numeric as paid_cash,
              COALESCE(dp_agg.paid_upi, 0)::numeric as paid_upi,
              CASE
                WHEN COALESCE(dp_agg.total_paid, 0) >= d.amount THEN 'PAID'
                WHEN COALESCE(dp_agg.total_paid, 0) > 0 THEN 'PARTIAL'
                ELSE 'PENDING'
              END as payment_status
       FROM donations d
       JOIN users u ON u.id = d.volunteer_id
       LEFT JOIN (
         SELECT 
           dp.donation_id, 
           SUM(dp.amount) as total_paid,
           SUM(CASE WHEN dp.payment_mode = 'CASH' THEN dp.amount ELSE 0 END) as paid_cash,
           SUM(CASE WHEN dp.payment_mode = 'UPI' THEN dp.amount ELSE 0 END) as paid_upi
         FROM donation_payments dp
         GROUP BY dp.donation_id
       ) dp_agg ON dp_agg.donation_id = d.id
       WHERE d.mandal_id = $1 AND d.is_voided = FALSE
       ORDER BY d.created_at DESC
       LIMIT 10`,
      [mandalId],
      [mandalId]
    );

    const totals = totalsRes.rows[0];
    const pendingTotals = pendingTotalsRes.rows[0];
    const expenses = expensesRes.rows[0];

    const totalCollected = parseFloat(totals.total_collected);
    const approvedExpenses = parseFloat(expenses.approved_expenses);

    return {
      mandal_id: mandalId,
      festival_total_collected: totalCollected,
      today_total_collected: parseFloat(totals.today_collected),
      today_cash_collected: parseFloat(totals.today_cash_collected),
      today_upi_collected: parseFloat(totals.today_upi_collected),
      today_pending_collected: parseFloat(pendingTotals.today_pending_collected),
      total_cash_collected: parseFloat(totals.cash_collected),
      total_upi_collected: parseFloat(totals.upi_collected),
      total_pending_collected: parseFloat(pendingTotals.pending_collected),
      total_cash_in_hand_volunteers: parseFloat(totals.cash_in_hand_volunteers),
      total_cash_reconciled: parseFloat(totals.cash_reconciled),
      total_approved_expenses: approvedExpenses,
      total_pending_expenses: parseFloat(expenses.pending_expenses),
      expenses_paid_cash: parseFloat(expenses.expenses_paid_cash),
      expenses_paid_upi: parseFloat(expenses.expenses_paid_upi),
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
      recent_donations: recentDonationsRes.rows,
    };
  }
}
