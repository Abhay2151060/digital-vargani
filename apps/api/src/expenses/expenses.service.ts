import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateExpenseInput, UpdateExpenseStatusInput, ExpenseStatus } from '@vargani/types';

@Injectable()
export class ExpensesService {
  constructor(private db: DbService) {}

  async createExpense(userId: string, input: CreateExpenseInput) {
    const res = await this.db.query(
      `INSERT INTO expenses (mandal_id, logged_by, category, amount, description, bill_photo_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [
        input.mandal_id,
        userId,
        input.category,
        input.amount,
        input.description,
        input.bill_photo_url || null,
      ],
      [input.mandal_id]
    );
    return res.rows[0];
  }

  async listExpenses(mandalId: string, status?: ExpenseStatus) {
    let queryStr = `
      SELECT e.*, u.full_name as logged_by_name, a.full_name as approved_by_name
      FROM expenses e
      JOIN users u ON u.id = e.logged_by
      LEFT JOIN users a ON a.id = e.approved_by
      WHERE e.mandal_id = $1 AND e.is_voided = FALSE
    `;
    const params: any[] = [mandalId];

    if (status) {
      params.push(status);
      queryStr += ` AND e.status = $${params.length}`;
    }

    queryStr += ` ORDER BY e.created_at DESC`;

    const res = await this.db.query(queryStr, params, [mandalId]);
    return res.rows;
  }

  async updateExpenseStatus(adminId: string, mandalId: string, input: UpdateExpenseStatusInput) {
    const res = await this.db.query(
      `UPDATE expenses
       SET status = $1, approved_by = $2, approved_at = NOW(), rejection_reason = $3, updated_at = NOW()
       WHERE id = $4 AND mandal_id = $5
       RETURNING *`,
      [input.status, adminId, input.rejection_reason || null, input.expense_id, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'EXPENSE_NOT_FOUND', message: 'Expense record not found' });
    }

    return res.rows[0];
  }

  async voidExpense(userId: string, mandalId: string, expenseId: string) {
    const res = await this.db.query(
      `UPDATE expenses
       SET is_voided = TRUE, updated_at = NOW()
       WHERE id = $1 AND mandal_id = $2
       RETURNING *`,
      [expenseId, mandalId],
      [mandalId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'EXPENSE_NOT_FOUND', message: 'Expense record not found' });
    }

    return res.rows[0];
  }
}
