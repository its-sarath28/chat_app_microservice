import mongoose, { Model, Types } from 'mongoose';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { USER_CLIENT } from '@app/common/token/token';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { User } from 'apps/user/entity/user.entity';
import { firstValueFrom } from 'rxjs';
import { ConversationService } from './conversation.service';
import { Member } from 'apps/chat/schema/member.schema';
import { MEMBER_ROLE } from 'apps/chat/enum/chat.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @Inject(USER_CLIENT) private userClient: ClientProxy,

    private conversationService: ConversationService,
  ) {}

  async getMembers(conversationId: string) {
    await this.conversationService.checkConversationExists(conversationId);

    const members: Member[] = await this.memberModel.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    const formatted = await Promise.all(
      members.map(async (member: Member) => {
        const user: User = await firstValueFrom(
          this.userClient.send(PATTERN.USER.GET_PROFILE, {
            userId: member.userId,
          }),
        );

        return {
          memberId: member._id,
          fullName: user.fullName,
          imageUrl: user.imageUrl ?? null,
          joinedOn: member.joinedOn,
          userId: member.userId,
        };
      }),
    );

    return formatted;
  }

  async addMembers(conversationId: string, userIds: number[]) {
    await this.conversationService.checkConversationExists(conversationId);

    const validUserIds: number[] = [];
    const inValidUserIds: number[] = [];

    userIds.map(async (id) => {
      const user = await firstValueFrom(
        this.userClient.send(PATTERN.USER.GET_PROFILE, { userId: id }),
      );

      user ? validUserIds.push(id) : inValidUserIds.push(id);
    });

    if (inValidUserIds.length) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: `Some user id's are invalid`,
      });
    }

    const newMembers = validUserIds.map((user) => ({
      conversationId,
      userId: user,
      role: MEMBER_ROLE.MEMBER,
    }));

    await this.memberModel.insertMany(newMembers);

    return {
      success: true,
      message: `${validUserIds.length} members added to the group`,
    };
  }

  async removeMember(conversationId: string, memberId: string) {
    await this.conversationService.checkConversationExists(conversationId);

    const removed = await this.memberModel.findByIdAndDelete(memberId);

    if (!removed) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member to remove not found',
      });
    }

    return { success: true, message: 'Member removed successfully' };
  }

  async getMemberRole(conversationId: string, memberId: string) {
    await this.conversationService.checkConversationExists(conversationId);

    const member: Member | null = await this.memberModel.findById(memberId);

    if (!member) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member not found',
      });
    }

    return member.role;
  }

  async changeMemberRole(
    conversationId: string,
    memberId: string,
    newRole: MEMBER_ROLE,
  ) {
    await this.conversationService.checkConversationExists(conversationId);

    const updated = await this.memberModel.findByIdAndUpdate(
      memberId,
      { $set: { role: newRole } },
      { new: true, upsert: true },
    );

    if (!updated) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member to update not found',
      });
    }

    return { success: true, message: 'Member role updated successfully' };
  }

  async checkIsMember(conversationId: string, memberId: number) {
    const member: Member | null = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: memberId,
    });

    if (!member) return false;

    return true;
  }
}
