import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, inviteMemberSchema, updateMemberRoleSchema, updateMemberStatusSchema } from '@vargani/types';
import { parseRequest } from '../common/validation/parse-request';

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
    @Body() body: unknown
  ) {
    const input = parseRequest(inviteMemberSchema, { ...(body as object), mandal_id: mandalId });
    const result = await this.membersService.inviteMember(inviterId, {
      ...input,
    });
    return {
      success: true,
      code: 'MEMBER_INVITED',
      message: `${input.full_name} added as ${input.role}`,
      data: result,
    };
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @CurrentUser('mandalId') mandalId: string,
    @Param('id') memberId: string,
    @Body() body: unknown
  ) {
    const { status } = parseRequest(updateMemberStatusSchema, body);
    const member = await this.membersService.updateMemberStatus(mandalId, memberId, status);
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
    @Body() body: unknown
  ) {
    const { role } = parseRequest(updateMemberRoleSchema, body);
    const member = await this.membersService.updateMemberRole(mandalId, memberId, role);
    return {
      success: true,
      code: 'MEMBER_ROLE_UPDATED',
      message: 'Member role updated',
      data: member,
    };
  }
}
