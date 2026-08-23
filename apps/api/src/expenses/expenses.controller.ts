import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExpenseInput, UpdateExpenseStatusInput, Role, ExpenseStatus } from '@vargani/types';

@Controller('expenses')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async listExpenses(
    @CurrentUser('mandalId') mandalId: string,
    @Query('status') status?: ExpenseStatus
  ) {
    const expenses = await this.expensesService.listExpenses(mandalId, status);
    return { success: true, code: 'EXPENSES_FETCHED', data: expenses };
  }

  @Post()
  async createExpense(
    @CurrentUser('userId') userId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: Omit<CreateExpenseInput, 'mandal_id'>
  ) {
    const expense = await this.expensesService.createExpense(userId, {
      ...body,
      mandal_id: mandalId,
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
    @Body() body: UpdateExpenseStatusInput
  ) {
    const expense = await this.expensesService.updateExpenseStatus(adminId, mandalId, body);
    return {
      success: true,
      code: 'EXPENSE_STATUS_UPDATED',
      message: `Expense ${body.status.toLowerCase()}`,
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
