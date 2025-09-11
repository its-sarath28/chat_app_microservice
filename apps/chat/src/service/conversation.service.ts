import mongoose, { Model } from 'mongoose';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateConversationDto } from '@app/common/dto/chat/chat.dto';

import { USER_CLIENT } from '@app/common/token/token';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { User } from 'apps/user/entity/user.entity';
import { firstValueFrom } from 'rxjs';
import { RedisProvider } from '@app/redis/redis.provider';
import { Member, MemberDocument } from 'apps/chat/schema/member.schema';
import {
  Conversation,
  ConversationDocument,
} from 'apps/chat/schema/conversation.schema';
import { CHAT_TYPE, MEMBER_ROLE } from 'apps/chat/enum/chat.enum';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Conversation.name) private converModel: Model<Conversation>,
    @Inject(USER_CLIENT) private userClient: ClientProxy,
    private readonly redisProvider: RedisProvider,
  ) {}

  async createConversation(data: CreateConversationDto) {
    const newConver: ConversationDocument = await this.converModel.create({
      type: data.type as CHAT_TYPE,
      createdBy: data.createdBy,
      createdOn: new Date(),
      groupName: data.groupName ?? null,
    });

    const members = data.members.map((member) => ({
      conversationId: newConver._id,
      userId: member,
      role:
        data.type === CHAT_TYPE.GROUP
          ? member === data.createdBy
            ? MEMBER_ROLE.ADMIN
            : MEMBER_ROLE.MEMBER
          : MEMBER_ROLE.MEMBER,
    }));

    await this.memberModel.insertMany(members);

    return newConver;
  }

  async getConversation(id: string, userId: number) {
    const conver: ConversationDocument | null =
      await this.converModel.findById(id);

    if (!conver) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation not found',
      });
    }

    if (conver.type === CHAT_TYPE.DIRECT) {
      const otherMember: MemberDocument | null = await this.memberModel.findOne(
        {
          conversationId: new mongoose.Types.ObjectId(id),
          userId: { $ne: userId },
        },
      );

      const user: User | null = await firstValueFrom(
        this.userClient.send(PATTERN.USER.FIND_BY_ID, {
          userId: otherMember?.userId,
        }),
      );

      return {
        ...conver.toObject(),
        friendId: user?.id! as number,
        friendName: user?.fullName ?? 'Unknown',
        imageUrl: user?.imageUrl ?? null,
        lastSeen: user?.lastSeen,
      };
    }

    return conver;
  }

  async getAllConversations(userId: number) {
    const cacheKey = `conversations:${userId}`;

    const cached = await this.redisProvider.getJson(cacheKey);
    if (cached) {
      console.log('Serving from Redis cache ✅');
      return cached;
    }

    const memberDocs = await this.memberModel
      .find({ userId })
      .select('conversationId');

    const uniqueConversationIds = [
      ...new Set(memberDocs.map((doc) => doc.conversationId.toString())),
    ];

    const objectIds = uniqueConversationIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const conversations: ConversationDocument[] = await this.converModel
      .find({
        _id: { $in: objectIds },
      })
      .sort({ lastMessageAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv: ConversationDocument) => {
        if (conv.type === CHAT_TYPE.DIRECT) {
          const members = await this.memberModel.find({
            conversationId: new mongoose.Types.ObjectId(conv._id as string),
          });

          const otherMember: MemberDocument | undefined = members.find(
            (m) => m.userId !== userId,
          );

          if (!otherMember) return conv;

          const user: User | null = await firstValueFrom(
            this.userClient.send(PATTERN.USER.FIND_BY_ID, {
              userId: otherMember.userId,
            }),
          );

          return {
            ...conv.toObject(),
            friendName: user?.fullName ?? 'Unknown',
            imageUrl: user?.imageUrl ?? null,
          };
        } else {
          return {
            ...conv.toObject(),
            friendName: null,
            imageUrl: null,
          };
        }
      }),
    );

    await this.redisProvider.setJson(cacheKey, formatted, 300);

    return formatted;
  }

  async updateLastMessage(conversationId: string, message: string) {
    const updated = await this.converModel.findByIdAndUpdate(
      conversationId,
      { $set: { lastMessageAt: new Date(), lastMessage: message } },
      { new: true, upsert: true },
    );

    if (!updated)
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation to update not found',
      });
  }

  async checkConversationExists(conversationId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Invalid conversation ID',
      });
    }

    const exists = await this.converModel.exists({
      _id: new mongoose.Types.ObjectId(conversationId),
    });

    if (!exists) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation not found',
      });
    }
  }
}
