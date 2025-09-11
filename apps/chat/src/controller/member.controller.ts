import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { MemberService } from '../service/member.service';
import { MEMBER_ROLE } from 'apps/chat/enum/chat.enum';

@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @MessagePattern(PATTERN.CHAT.GET_MEMBERS)
  getMembers(@Payload() data: { conversationId: string }) {
    return this.memberService.getMembers(data.conversationId);
  }

  @MessagePattern(PATTERN.CHAT.ADD_MEMBERS)
  addMembers(@Payload() data: { conversationId: string; userIds: number[] }) {
    return this.memberService.addMembers(data.conversationId, data.userIds);
  }

  @MessagePattern(PATTERN.CHAT.REMOVE_MEMBER)
  removeMember(@Payload() data: { conversationId: string; memberId: string }) {
    return this.memberService.removeMember(data.conversationId, data.memberId);
  }

  @MessagePattern(PATTERN.CHAT.GET_MEMBER_ROLE)
  getMemberRole(@Payload() data: { conversationId: string; memberId: string }) {
    return this.memberService.getMemberRole(data.conversationId, data.memberId);
  }

  @MessagePattern(PATTERN.CHAT.CHANGE_MEMBER_ROLE)
  changeMemberRole(
    @Payload()
    data: {
      conversationId: string;
      memberId: string;
      newRole: MEMBER_ROLE;
    },
  ) {
    return this.memberService.changeMemberRole(
      data.conversationId,
      data.memberId,
      data.newRole,
    );
  }

  @MessagePattern(PATTERN.CHAT.CHECK_IS_MEMBER)
  checkIsMember(@Payload() data: { conversationId: string; memberId: number }) {
    return this.memberService.checkIsMember(data.conversationId, data.memberId);
  }
}
