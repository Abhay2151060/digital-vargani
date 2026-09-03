import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { createExpenseSchema, ExpenseStatus, Role, updateExpenseStatusSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';
import { z } from 'zod';

@Controller('expenses')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async listExpenses(
    @CurrentUser('mandalId') mandalId: string,
    @Query('status') status?: string
  ) {
    const { status: parsedStatus } = parseRequest(z.object({ status: z.nativeEnum(ExpenseStatus).optional() }), { status });
    const expenses = await this.expensesService.listExpenses(mandalId, parsedStatus);
    return { success: true, code: 'EXPENSES_FETCHED', data: expenses };
  }

  @Post()
  async createExpense(
    @CurrentUser('userId') userId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const input = parseRequest(createExpenseSchema, { ...(body as object), mandal_id: mandalId });
    const expense = await this.expensesService.createExpense(userId, {
      ...input,
    });
    return {
      success: true,
      code: 'EXPENSE_LOGGED',
      message: 'Expense logged and submitted for Admin approval',
      data: expense,
    };
  }

  @Put('status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @CurrentUser('userId') adminId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const input = parseRequest(updateExpenseStatusSchema, body);
    const expense = await this.expensesService.updateExpenseStatus(adminId, mandalId, input);
    return {
      success: true,
      code: 'EXPENSE_STATUS_UPDATED',
      message: `Expense ${input.status.toLowerCase()}`,
      data: expense,
    };
  }

  @Put(':id/void')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async voidExpense(
    @CurrentUser('userId') adminId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Param('id') expenseId: string
  ) {
    const expense = await this.expensesService.voidExpense(adminId, mandalId, expenseId);
    return {
      success: true,
      code: 'EXPENSE_VOIDED',
      message: 'Expense voided',
      data: expense,
    };
  }
}
