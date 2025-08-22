import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthenticatedSocket } from '@app/common/interface/socket/socket.interface';

@Injectable()
export class SocketGatewayService {
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private server: Server;

  constructor(private readonly jwtService: JwtService) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authHeader = client.handshake.headers.authorization as string;

      if (!authHeader?.startsWith(`Bearer `)) {
        throw new UnauthorizedException('Missing or invalid token');
      }

      const token = authHeader.split(' ')[1];
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

      this.connectedClients.set(client.id, client);

      console.log(`✅ ${client.user.email} connected - ${client.id}`);
    } catch (err) {
      console.error(`❌ Socket connection refused: ${err.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
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

  async joinRoom(client: AuthenticatedSocket, roomId: string) {
    client.join(roomId);
    console.log(`👥 User ${client.user?.id} joined room ${roomId}`);
  }

  async leaveRoom(client: AuthenticatedSocket, roomId: string) {
    client.leave(roomId);
    console.log(`🚪 User ${client.user?.id} left room ${roomId}`);
  }

  sendToRoom(roomId: string, event: string, payload: any) {
    if (!this.server) {
      console.error('❌ Server not attached to SocketGatewayService');
      return;
    }
    this.server.to(roomId).emit(event, payload);
    console.log(`📢 Sent "${event}" to room ${roomId}`);
  }
}
