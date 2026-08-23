import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, MemberStatus, InviteMemberInput } from '@vargani/types';

@Controller('members')
@UseGuards(AuthGuard, RolesGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TREASURER)
  async listMembers(@CurrentUser('mandalId') mandalId: string) {
    const members = await this.membersService.listMembers(mandalId);
    return { success: true, code: 'MEMBERS_FETCHED', data: members };
  }

  @Post('invite')
  @Roles(Role.ADMIN)
  async inviteMember(
    @CurrentUser('userId') inviterId: string,
    @CurrentUser('mandalId') mandalId: string,
    @Body() body: Omit<InviteMemberInput, 'mandal_id'>
  ) {
    const result = await this.membersService.inviteMember(inviterId, {
      ...body,
      mandal_id: mandalId,
    });
    return {
      success: true,
      code: 'MEMBER_INVITED',
      message: `${body.full_name} added as ${body.role}`,
      data: result,
    };
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @CurrentUser('mandalId') mandalId: string,
    @Param('id') memberId: string,
    @Body() body: { status: MemberStatus }
  ) {
    const member = await this.membersService.updateMemberStatus(mandalId, memberId, body.status);
    return {
      success: true,
      code: 'MEMBER_STATUS_UPDATED',
      message: 'Member status updated',
      data: member,
    };
  }

  @Put(':id/role')
  @Roles(Role.ADMIN)
  async updateRole(
    @CurrentUser('mandalId') mandalId: string,
    @Param('id') memberId: string,
    @Body() body: { role: Role }
  ) {
    const member = await this.membersService.updateMemberRole(mandalId, memberId, body.role);
    return {
      success: true,
      code: 'MEMBER_ROLE_UPDATED',
      message: 'Member role updated',
      data: member,
    };
  }
}
