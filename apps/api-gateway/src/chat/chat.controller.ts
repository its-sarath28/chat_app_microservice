import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Query,
  Req,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ChatService } from './chat.service';

import { AuthUser } from '@app/common/dto/auth/auth.dto';
import {
  AddMemberDto,
  ChangeMemberRoleDto,
  DeleteMessageDto,
  EditMessageDto,
  RemoveMemberDto,
  SendMessageDto,
} from './dto/chat-api.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ========================
  // ======Conversation======
  // ========================
  @Get('conversation/all')
  @UseGuards(AuthGuard())
  getAllConversations(@Req() req: AuthUser) {
    return this.chatService.getAllConversations(req.user.id);
  }

  @Get('conversation')
  @UseGuards(AuthGuard())
  getConversation(
    @Query('conversationId') conversationId: string,
    @Req() req: AuthUser,
  ) {
    return this.chatService.getConversation(conversationId, req.user.id);
  }

  // =========================
  // =========Message=========
  // =========================
  @Post('message/send')
  @UseGuards(AuthGuard())
  sendMessage(@Body() data: SendMessageDto, @Req() req: AuthUser) {
    return this.chatService.sendMessage(data, +req.user.id);
  }

  @Patch('message/update/:messageId')
  @UseGuards(AuthGuard())
  editMessage(
    @Param('messageId') messageId: string,
    @Body() data: EditMessageDto,
    @Req() req: AuthUser,
  ) {
    return this.chatService.editMessage(messageId, data, +req.user.id);
  }

  @Delete('message/update')
  @UseGuards(AuthGuard())
  deleteMessages(@Body() data: DeleteMessageDto, @Req() req: AuthUser) {
    return this.chatService.deleteMessages(data, req.user.id);
  }

  // ==========================
  // ==========Member==========
  // ==========================
  @Get('member')
  @UseGuards(AuthGuard())
  getMembers(
    @Query('conversationId') conversationId: string,
    @Req() req: AuthUser,
  ) {
    return this.chatService.getMembers(conversationId, req.user.id);
  }

  @Post('member/add')
  @UseGuards(AuthGuard())
  addMembers(@Body() data: AddMemberDto, @Req() req: AuthUser) {
    return this.chatService.addMembers(
      data.conversationId,
      data.membersToAdd,
      req.user.id,
    );
  }

  @Post('member/remove')
  @UseGuards(AuthGuard())
  removeMembers(@Body() data: RemoveMemberDto, @Req() req: AuthUser) {
    return this.chatService.removeMember(
      data.conversationId,
      data.memberToRemove,
      req.user.id,
    );
  }

  @Patch('member/change-role')
  @UseGuards(AuthGuard())
  changeMemberRole(@Body() data: ChangeMemberRoleDto, @Req() req: AuthUser) {
    return this.chatService.changeMemberRole(data, req.user.id);
  }
}
