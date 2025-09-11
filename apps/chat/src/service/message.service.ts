import { Model } from 'mongoose';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreateMessageDto } from '@app/common/dto/chat/chat.dto';

import { SOCKET_CLIENT } from '@app/common/token/token';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { RedisProvider } from '@app/redis/redis.provider';
import { Message, MessageDocument } from 'apps/chat/schema/message.schema';
import {
  Conversation,
  ConversationDocument,
} from 'apps/chat/schema/conversation.schema';
import { CHAT_TYPE } from 'apps/chat/enum/chat.enum';
import { NewMessagePayloadDto } from 'apps/socket-gateway/src/dto/message.dto';
import { ConversationService } from './conversation.service';
import { SOCKET_EVENT } from '@app/common/pattern/event';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name) private converModel: Model<Conversation>,

    @Inject(SOCKET_CLIENT) private wsClient: ClientProxy,
    private readonly redisProvider: RedisProvider,
    private conversationService: ConversationService,
  ) {}

  async createMessage(data: CreateMessageDto) {
    // TODO: Handle medias

    const newMessage: MessageDocument = await this.messageModel.create(data);

    const conver: ConversationDocument | null = await this.converModel.findById(
      data.conversationId,
    );

    if (conver) {
      const pattern =
        conver?.type === CHAT_TYPE.DIRECT
          ? PATTERN.MESSAGE.NEW_DIRECT_MESSAGE
          : PATTERN.MESSAGE.NEW_GROUP_MESSAGE;

      this.wsClient.emit<NewMessagePayloadDto>(pattern, {
        conversationId: newMessage.conversationId,
        messageId: newMessage._id,
        sender: newMessage.sender,
        messageType: newMessage.type,
        mediaUrl: newMessage.mediaUrl,
        text: newMessage.text,
      });
    }

    await this.conversationService.updateLastMessage(
      data.conversationId,
      data.text || ' ',
    );

    const cacheKey = `messages:${data.conversationId}`;
    await this.redisProvider.lpush(cacheKey, newMessage);
    await this.redisProvider.ltrim(cacheKey, 0, 49);

    return newMessage;
  }

  async getAllMessages(conversationId: string) {
    await this.conversationService.checkConversationExists(conversationId);

    const cacheKey = `messages:${conversationId}`;

    const cached = await this.redisProvider.getJson(cacheKey);
    if (cached) {
      console.log('Serving from Redis cache ✅');
      return cached;
    }

    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    await this.redisProvider.setJson(cacheKey, messages, 300);

    return messages;
  }

  async getMessage(messageId: string) {
    const message: Message | null = await this.messageModel.findById(messageId);

    if (!message) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Message not found',
      });
    }

    return message;
  }

  async editMessage(messageId: string, message: string) {
    const updatedMessage: MessageDocument | null =
      await this.messageModel.findByIdAndUpdate(
        messageId,
        { $set: { text: message, isEdited: true } },
        { new: true, upsert: true },
      );

    if (!updatedMessage) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Message to update not found',
      });
    }

    // this.wsClient.emit(PATTERN.CHAT.NEW_MESSAGE, {
    //   conversationId: updatedMessage.conversationId,
    //   event: SOCKET_EVENT.CHAT.UPDATE_MESSAGE,
    //   payload: {
    //     sender: updatedMessage.sender,
    //     messageType: updatedMessage.type,
    //     mediaUrl: updatedMessage.mediaUrl,
    //     text: updatedMessage.text,
    //   },
    // });

    const cacheKey = `messages:${updatedMessage.conversationId}`;
    const cached = await this.redisProvider.lrange<MessageDocument>(
      cacheKey,
      0,
      -1,
    );

    if (cached.length > 0) {
      const newList = cached.map((m) =>
        m._id.toString() === updatedMessage._id.toString()
          ? { ...m, text: updatedMessage.text, isEdited: true }
          : m,
      );

      await this.redisProvider.getClient().del(cacheKey);
      for (let i = newList.length - 1; i >= 0; i--) {
        await this.redisProvider.lpush(cacheKey, newList[i]);
      }
      await this.redisProvider.ltrim(cacheKey, 0, 49);
    }

    return { success: true, data: updatedMessage };
  }

  async deleteMessage(messageIds: string[], userId: number) {
    const messages: Message[] = await this.messageModel.find({
      _id: { $in: messageIds },
      sender: userId,
    });

    if (messages.length !== messageIds.length) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Some messages are not found or not send by you',
      });
    }

    const result = await this.messageModel.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isDeleted: true } },
    );

    const conversationId = messages[0].conversationId;
    const cacheKey = `messages:${conversationId}`;

    const cached = await this.redisProvider.lrange<MessageDocument>(
      cacheKey,
      0,
      -1,
    );

    if (cached.length > 0) {
      const newList = cached.map((m) =>
        messageIds.includes(m._id.toString()) ? { ...m, isDeleted: true } : m,
      );

      await this.redisProvider.getClient().del(cacheKey);
      for (let i = newList.length - 1; i >= 0; i--) {
        await this.redisProvider.lpush(cacheKey, newList[i]);
      }
      await this.redisProvider.ltrim(cacheKey, 0, 49);
    }

    this.wsClient.emit(PATTERN.CHAT.DELETE_MESSAGE, {
      conversationId: messages[0].conversationId,
      event: SOCKET_EVENT.CHAT.DELETE_MESSAGE,
      payload: {
        messageIds,
      },
    });

    return result;
  }
}
