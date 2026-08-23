import { Controller, Get, Param } from '@nestjs/common';
import { TransparencyService } from './transparency.service';

@Controller('transparency')
export class TransparencyController {
  constructor(private transparencyService: TransparencyService) {}

  @Get(':slug')
  async getReport(@Param('slug') slug: string) {
    const report = await this.transparencyService.getTransparencyReport(slug);
    return {
      success: true,
      code: 'TRANSPARENCY_REPORT_FETCHED',
      data: report,
    };
  }
}
