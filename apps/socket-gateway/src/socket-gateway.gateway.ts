import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SocketGatewayService } from './socket-gateway.service';

import { AuthenticatedSocket } from '@app/common/interface/socket/socket.interface';
import { SOCKET_EVENT } from '@app/common/pattern/event';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsService: SocketGatewayService) {}

  afterInit() {
    this.wsService.setServer(this.server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    await this.wsService.handleConnection(client);
  }

  async handleDisconnect(client: Socket) {
    await this.wsService.handleDisconnect(client);
  }

  @SubscribeMessage(SOCKET_EVENT.CHAT.JOIN_CONVERSATION)
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.wsService.joinRoom(client, data.conversationId);
  }

  @SubscribeMessage(SOCKET_EVENT.CHAT.LEAVE_CONVERSATION)
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.wsService.leaveRoom(client, data.conversationId);
  }
}
