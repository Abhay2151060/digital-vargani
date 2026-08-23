import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDonationInput, SyncDonationsBatchInput, CreateCorrectionInput, VoidDonationInput, Role } from '@vargani/types';

@Controller('donations')
export class DonationsController {
  constructor(private donationsService: DonationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createDonation(
    @CurrentUser('userId') volunteerId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: Omit<CreateDonationInput, 'mandal_id'>
  ) {
    const donation = await this.donationsService.createDonation(volunteerId, {
      ...body,
      mandal_id: mandalId,
    });
    return {
      success: true,
      code: 'DONATION_RECORDED',
      message: 'Donation recorded successfully',
      data: donation,
    };
  }

  @Post('sync-batch')
  @UseGuards(AuthGuard)
  async syncBatch(
    @CurrentUser('userId') volunteerId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: Omit<SyncDonationsBatchInput, 'mandal_id'>
  ) {
    const results = await this.donationsService.syncBatch(volunteerId, {
      ...body,
      mandal_id: mandalId,
    });
    return {
      success: true,
      code: 'SYNC_COMPLETED',
      data: results,
    };
  }

  @Get('my-allocation')
  @UseGuards(AuthGuard)
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
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    // Role-based scoping: VOLUNTEER can only view their own recorded donations
    const targetVolunteerId = role === Role.VOLUNTEER ? userId : volunteerId;
    const list = await this.donationsService.listDonations(mandalId, { volunteerId: targetVolunteerId, limit, offset });
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
    @Param('id') donationId: string
  ) {
    const donation = await this.donationsService.getDonationById(mandalId, donationId);
    return { success: true, code: 'DONATION_FETCHED', data: donation };
  }

  @Post('correct')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.TREASURER, Role.ADMIN)
  async correctDonation(
    @CurrentUser('userId') userId: string,
    @Body() body: CreateCorrectionInput
  ) {
    const donation = await this.donationsService.correctDonation(userId, body);
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
    @Body() body: VoidDonationInput
  ) {
    const donation = await this.donationsService.voidDonation(userId, body);
    return {
      success: true,
      code: 'DONATION_VOIDED',
      message: 'Donation marked as voided',
      data: donation,
    };
  }
}
