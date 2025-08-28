import { Server } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { CHAT_CLIENT, USER_CLIENT } from '@app/common/token/token';
import { RedisProvider } from '../../../libs/redis/src/redis.provider';
import { REDIS_PATTERN, SOCKET_EVENT } from '@app/common/pattern/event';
import { AuthenticatedSocket } from '@app/common/interface/socket/socket.interface';
import { NewMessagePayloadDto } from './dto/message.dto';
import { MemberDocument } from 'apps/chat/schema/member.schema';
import { User } from 'apps/user/entity/user.entity';
import { MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';
import { ConversationDocument } from 'apps/chat/schema/conversation.schema';

@Injectable()
export class SocketGatewayService {
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private server: Server;

  constructor(
    @Inject(CHAT_CLIENT) private chatClient: ClientProxy,
    @Inject(USER_CLIENT) private userClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly redisProvider: RedisProvider,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        throw new UnauthorizedException('Missing or invalid token');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });

      if (!payload?.id) {
        throw new UnauthorizedException('Invalid token');
      }

      client.user = {
        id: payload.id.toString(),
        email: payload.email,
      };

      await this.redisProvider.sadd(REDIS_PATTERN.ONLINE_USERS, payload.id);

      this.connectedClients.set(client.id, client);

      const onlineUsers = await this.redisProvider.smembers(
        REDIS_PATTERN.ONLINE_USERS,
      );

      this.server.emit(SOCKET_EVENT.USER.ONLINE_USERS, {
        users: onlineUsers,
      });

      console.log(`✅ ${client.user.email} connected - ${client.id}`);
    } catch (err) {
      console.error(`❌ Socket connection refused: ${err.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user?.id) {
      this.userClient.emit(PATTERN.USER.UPDATE_LAST_SEEN, {
        userId: client.user.id,
      });

      await this.redisProvider.srem(REDIS_PATTERN.ONLINE_USERS, client.user.id);

      const onlineUsers = await this.redisProvider.smembers(
        REDIS_PATTERN.ONLINE_USERS,
      );

      this.server.emit(SOCKET_EVENT.USER.ONLINE_USERS, {
        users: onlineUsers,
      });
    }

    this.connectedClients.delete(client.id);

    console.log(`❌ Client disconnected: ${client.id}`);
  }

  getClientsByUserId(userId: string): AuthenticatedSocket[] {
    return Array.from(this.connectedClients.values()).filter(
      (client) => client.user?.id === userId,
    );
  }

  sendToUser(userId: string, event: string, payload: any) {
    const clients = this.getClientsByUserId(userId);
    if (!clients.length) {
      console.warn(`⚠️ No active sockets found for user ${userId}`);
      return;
    }

    clients.forEach((client) => {
      client.emit(event, payload);
    });

    console.log(
      `📨 Sent "${event}" to user ${userId} (${clients.length} socket(s))`,
    );
  }

  async joinRoom(client: AuthenticatedSocket, conversationId: string) {
    if (!client.user) {
      console.warn('⚠️ client.user or client.user.id is undefined');
      return;
    }

    const isMember = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId,
        memberId: Number(client.user.id),
      }),
    );

    if (!isMember) return;

    client.join(conversationId);
    console.log(`👥 User ${client.user?.id} joined room ${conversationId}`);
  }

  async leaveRoom(client: AuthenticatedSocket, conversationId: string) {
    client.leave(conversationId);
    console.log(`🚪 User ${client.user?.id} left room ${conversationId}`);
  }

  sendToRoom(conversationId: string, event: string, payload: any) {
    if (!this.server) {
      console.error('❌ Server not attached to SocketGatewayService');
      return;
    }
    this.server.to(conversationId).emit(event, payload);
    console.log(`📢 Sent "${event}" to room ${conversationId}`);
  }

  async getOnlineUsers(): Promise<string[]> {
    const onlineUsers = await this.redisProvider.smembers(
      REDIS_PATTERN.ONLINE_USERS,
    );
    return onlineUsers;
  }

  handleStartTyping(conversationId: string, client: AuthenticatedSocket) {
    return this.sendToRoom(conversationId, SOCKET_EVENT.CHAT.TYPING_STARTED, {
      userId: client.user?.id,
      conversationId,
    });
  }

  handleStopTyping(conversationId: string, client: AuthenticatedSocket) {
    return this.sendToRoom(conversationId, SOCKET_EVENT.CHAT.TYPING_STOPPED, {
      userId: client.user?.id,
      conversationId,
    });
  }

  async sendDirectMessage(
    conversationId: string,
    payload: NewMessagePayloadDto,
  ) {
    this.server
      .to(conversationId)
      .emit(SOCKET_EVENT.MESSAGE.NEW_DIRECT_MESSAGE, payload);

    const sender: User = await firstValueFrom(
      this.userClient.send(PATTERN.USER.FIND_BY_ID, { userId: payload.sender }),
    );

    const members: MemberDocument[] = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.GET_MEMBERS, { conversationId }),
    );

    const receiver = members.find((member) => member.userId !== payload.sender);
    if (!receiver) return;

    const receiverSockets = this.getClientsByUserId(receiver.userId.toString());

    for (const socket of receiverSockets) {
      const rooms = Array.from(socket.rooms);
      const isInConversation = rooms.includes(conversationId);

      if (!isInConversation) {
        this.server
          .to(socket.id)
          .emit(SOCKET_EVENT.MESSAGE.NEW_MESSAGE_NOTIFICATION, {
            title: `New message from ${sender.username || 'Unknown'}`,
            message:
              payload.messageType !== MESSAGE_TYPE.TEXT
                ? payload.messageType
                : payload.text,
          });
      }
    }
  }

  async sendGroupMessage(
    conversationId: string,
    payload: NewMessagePayloadDto,
  ) {
    this.server
      .to(conversationId)
      .emit(SOCKET_EVENT.MESSAGE.NEW_GROUP_MESSAGE, payload);

    const [conver, sender]: [ConversationDocument, User] = await Promise.all([
      firstValueFrom(
        this.chatClient.send(PATTERN.CHAT.GET_CONVERSATION, { conversationId }),
      ),
      firstValueFrom(
        this.userClient.send(PATTERN.USER.FIND_BY_ID, {
          userId: payload.sender,
        }),
      ),
    ]);

    const members: MemberDocument[] = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.GET_MEMBERS, { conversationId }),
    );

    for (const member of members) {
      if (member.userId === payload.sender) continue;

      const receiverSockets = this.getClientsByUserId(member.userId.toString());

      for (const socket of receiverSockets) {
        const rooms = Array.from(socket.rooms);
        const isInConversation = rooms.includes(conversationId);

        if (!isInConversation) {
          this.server
            .to(socket.id)
            .emit(SOCKET_EVENT.MESSAGE.NEW_MESSAGE_NOTIFICATION, {
              title: `${conver.groupName}`,
              message: `${sender.username || 'Unknown'}: ${
                payload.messageType !== MESSAGE_TYPE.TEXT
                  ? payload.messageType
                  : payload.text
              }`,
            });
        }
      }
    }
  }
}
