import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReconciliationInput, DiscrepancyStatus, Role } from '@vargani/types';

@Controller('reconciliation')
@UseGuards(AuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private reconciliationService: ReconciliationService) {}

  @Get('overview')
  @Roles(Role.TREASURER, Role.ADMIN)
  async getOverview(@CurrentUser('mandalId') mandalId: string) {
    const overview = await this.reconciliationService.getTreasurerOverview(mandalId);
    return { success: true, code: 'OVERVIEW_FETCHED', data: overview };
  }

  @Get('volunteer-summary/:volunteerId')
  @Roles(Role.TREASURER, Role.ADMIN)
  async getVolunteerSummary(
    @CurrentUser('mandalId') mandalId: string,
    @Param('volunteerId') volunteerId: string
  ) {
    const summary = await this.reconciliationService.getVolunteerCashSummary(mandalId, volunteerId);
    return { success: true, code: 'SUMMARY_FETCHED', data: summary };
  }

  @Get('history')
  @Roles(Role.TREASURER, Role.ADMIN)
  async listHistory(@CurrentUser('mandalId') mandalId: string) {
    const history = await this.reconciliationService.listReconciliations(mandalId);
    return { success: true, code: 'HISTORY_FETCHED', data: history };
  }

  @Post('handover')
  @Roles(Role.TREASURER, Role.ADMIN)
  async reconcileHandover(
    @CurrentUser('userId') treasurerId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: Omit<CreateReconciliationInput, 'mandal_id'>
  ) {
    const result = await this.reconciliationService.reconcileCash(treasurerId, {
      ...body,
      mandal_id: mandalId,
    });
    return {
      success: true,
      code: 'RECONCILIATION_RECORDED',
      message:
        result.discrepancy_status === DiscrepancyStatus.NONE
          ? 'Cash handover successfully matched and reconciled'
          : 'Cash handover recorded with a discrepancy',
      data: result,
    };
  }

  @Put(':id/resolve')
  @Roles(Role.TREASURER, Role.ADMIN)
  async resolveDiscrepancy(
    @CurrentUser('mandalId') mandalId: string,
    @Param('id') reconciliationId: string,
    @Body() body: { status: DiscrepancyStatus; notes?: string }
  ) {
    const result = await this.reconciliationService.resolveDiscrepancy(
      mandalId,
      reconciliationId,
      body.status,
      body.notes
    );
    return {
      success: true,
      code: 'DISCREPANCY_RESOLVED',
      message: 'Discrepancy status updated',
      data: result,
    };
  }
}
