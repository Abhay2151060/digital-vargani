import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MandalsService } from './mandals.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, createMandalSchema, updateMandalProfileSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';

@Controller('mandals')
export class MandalsController {
  constructor(private mandalsService: MandalsService) {}

  @Get('current')
  @UseGuards(AuthGuard)
  async getCurrentMandal(@CurrentUser('mandalId') mandalId: string) {
    const mandal = await this.mandalsService.getMandalById(mandalId);
    return { success: true, code: 'MANDAL_FOUND', data: mandal };
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const mandal = await this.mandalsService.getMandalBySlug(slug);
    return { success: true, code: 'MANDAL_FOUND', data: mandal };
  }

  @Post()
  @UseGuards(AuthGuard)
  async createMandal(
    @CurrentUser('userId') userId: string,
    @Body() body: unknown
  ) {
    const mandal = await this.mandalsService.createMandal(userId, parseRequest(createMandalSchema, body));
    return {
      success: true,
      code: 'MANDAL_CREATED',
      message: 'Mandal setup completed',
      data: mandal,
    };
  }

  @Put('current')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCurrentMandal(
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: unknown
  ) {
    const mandal = await this.mandalsService.updateMandal(mandalId, parseRequest(updateMandalProfileSchema, body));
    return {
      success: true,
      code: 'MANDAL_UPDATED',
      message: 'Mandal settings updated',
      data: mandal,
    };
  }
}
