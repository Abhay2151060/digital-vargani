import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@vargani/types';

@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.TREASURER, Role.ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('donations/csv')
  async exportDonations(
    @CurrentUser('mandalId') mandalId: string,
    @Res() res: Response
  ) {
    const csv = await this.reportsService.exportDonationsCsv(mandalId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="donations-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('expenses/csv')
  async exportExpenses(
    @CurrentUser('mandalId') mandalId: string,
    @Res() res: Response
  ) {
    const csv = await this.reportsService.exportExpensesCsv(mandalId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${Date.now()}.csv"`);
    res.send(csv);
  }
}
