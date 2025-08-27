import { Server } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthenticatedSocket } from '@app/common/interface/socket/socket.interface';
import { CHAT_CLIENT, USER_CLIENT } from '@app/common/token/token';
import { ClientProxy } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { RedisProvider } from '../../../libs/redis/src/redis.provider';
import { REDIS_PATTERN, SOCKET_EVENT } from '@app/common/pattern/event';

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

      client.emit(SOCKET_EVENT.USER.ONLINE_USERS, { users: onlineUsers });

      // (Optional) broadcast to everyone else too
      this.server.emit(SOCKET_EVENT.USER.ONLINE_USERS, { users: onlineUsers });

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

      this.server.emit(SOCKET_EVENT.USER.ONLINE_USERS, { users: onlineUsers });
    }

    this.connectedClients.delete(client.id);

    console.log(`❌ Client disconnected: ${client.id}`);
  }

  getClient(clientId: string): AuthenticatedSocket | undefined {
    return this.connectedClients.get(clientId);
  }

  getAllClients(): AuthenticatedSocket[] {
    return Array.from(this.connectedClients.values());
  }

  getClientByUserId(userId: string): AuthenticatedSocket | undefined {
    for (const client of this.connectedClients.values()) {
      if (client.user?.id === userId) {
        return client;
      }
    }
    return undefined;
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

  broadcastExceptUser(userId: string, event: string, payload: any) {
    const clients = this.getAllClients();

    clients.forEach((client) => {
      if (client.user?.id !== userId) {
        client.emit(event, payload);
      }
    });

    console.log(`📢 Broadcasted "${event}" to all except user ${userId}`);
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

  async getOnlineUsers(client: AuthenticatedSocket): Promise<string[]> {
    const onlineUsers = await this.redisProvider.smembers(
      REDIS_PATTERN.ONLINE_USERS,
    );
    return onlineUsers;
  }
}
