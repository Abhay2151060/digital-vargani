import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDonationInput, SyncDonationsBatchInput, CreateCorrectionInput, VoidDonationInput, CollectPendingDonationInput, Role } from '@vargani/types';
import { collectPendingDonationSchema, createCorrectionSchema, createDonationSchema, syncDonationsBatchSchema, voidDonationSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';

@Controller('donations')
export class DonationsController {
  constructor(private donationsService: DonationsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER)
  async createDonation(
    @CurrentUser('userId') volunteerId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const input = parseRequest(createDonationSchema, { ...(body as object), mandal_id: mandalId });
    const donation = await this.donationsService.createDonation(volunteerId, {
      ...input,
    });
    return {
      success: true,
      code: 'DONATION_RECORDED',
      message: 'Donation recorded successfully',
      data: donation,
    };
  }

  @Post('sync-batch')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER)
  async syncBatch(
    @CurrentUser('userId') volunteerId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const input = parseRequest(syncDonationsBatchSchema, { ...(body as object), mandal_id: mandalId });
    const results = await this.donationsService.syncBatch(volunteerId, {
      ...input,
    });
    return {
      success: true,
      code: 'SYNC_COMPLETED',
      data: results,
    };
  }

  @Get('my-allocation')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER)
  async getMyAllocation(
    @CurrentUser('userId') volunteerId: string,
    @CurrentUser('mandalId') mandalId: string
  ) {
    const allocation = await this.donationsService.getVolunteerAllocations(mandalId, volunteerId);
    return { success: true, code: 'ALLOCATION_FETCHED', data: allocation };
  }

  @Get()
  @UseGuards(AuthGuard)
  async listDonations(
    @CurrentUser('mandalId') mandalId: string,
    @CurrentUser('role') role: Role,
    @CurrentUser('userId') userId: string,
    @Query('volunteerId') volunteerId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    // IDOR Defense: If caller is a VOLUNTEER, restrict strictly to their own donations
    const effectiveVolunteerId = role === Role.VOLUNTEER ? userId : volunteerId;
    const parsedLimit = Math.min(Math.max(parseInt(limit || '100', 10) || 100, 1), 100);
    const parsedOffset = Math.max(parseInt(offset || '0', 10) || 0, 0);

    const list = await this.donationsService.listDonations(mandalId, {
      volunteerId: effectiveVolunteerId,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return { success: true, code: 'DONATIONS_FETCHED', data: list };
  }

  @Get('receipt/lookup/:receiptNumber')
  async getPublicReceiptByNumber(@Param('receiptNumber') receiptNumber: string) {
    const receipt = await this.donationsService.getReceiptByNumberOnly(receiptNumber);
    return { success: true, code: 'RECEIPT_FETCHED', data: receipt };
  }

  @Get('receipt/:slug/:receiptNumber')
  async getPublicReceipt(
    @Param('slug') slug: string,
    @Param('receiptNumber') receiptNumber: string
  ) {
    const receipt = await this.donationsService.getReceiptByNumber(slug, receiptNumber);
    return { success: true, code: 'RECEIPT_FETCHED', data: receipt };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getDonation(
    @CurrentUser('mandalId') mandalId: string,
    @CurrentUser('role') role: Role,
    @CurrentUser('userId') userId: string,
    @Param('id') donationId: string
  ) {
    const donation = await this.donationsService.getDonationById(mandalId, donationId);
    // If volunteer, only allow viewing if they recorded it
    if (role === Role.VOLUNTEER && donation.volunteer_id !== userId) {
      return { success: false, code: 'FORBIDDEN', message: 'You can only view your own donation records' };
    }
    return { success: true, code: 'DONATION_FETCHED', data: donation };
  }

  @Post('correct')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER, Role.ADMIN)
  async correctDonation(
    @CurrentUser('userId') userId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const donation = await this.donationsService.correctDonation(userId, mandalId, parseRequest(createCorrectionSchema, body));
    return {
      success: true,
      code: 'DONATION_CORRECTED',
      message: 'Donation amount updated with audit record',
      data: donation,
    };
  }

  @Post('void')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER, Role.ADMIN)
  async voidDonation(
    @CurrentUser('userId') userId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const donation = await this.donationsService.voidDonation(userId, mandalId, parseRequest(voidDonationSchema, body));
    return {
      success: true,
      code: 'DONATION_VOIDED',
      message: 'Donation marked as voided',
      data: donation,
    };
  }

  @Post('collect-pending')
  @UseGuards(AuthGuard)
  async collectPendingDonation(
    @CurrentUser('userId') userId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const donation = await this.donationsService.collectPendingDonation(userId, mandalId, parseRequest(collectPendingDonationSchema, body));
    return {
      success: true,
      code: 'PENDING_DONATION_COLLECTED',
      message: 'Pending donation recorded as collected',
      data: donation,
    };
  }
}
