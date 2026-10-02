import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ProgressEventPayload } from '@turbograb/types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
  }

  @SubscribeMessage('subscribe_download')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { downloadId: string },
  ) {
    if (data?.downloadId) {
      client.join(`download:${data.downloadId}`);
      this.logger.log(`Client ${client.id} subscribed to download:${data.downloadId}`);
      return { status: 'subscribed', downloadId: data.downloadId };
    }
    return { status: 'ignored' };
  }

  emitProgress(payload: ProgressEventPayload) {
    if (!this.server) return;

    // Emit globally for live dashboards
    this.server.emit('download_progress', payload);

    // Emit specifically to subscribers of this download
    if (payload.downloadId) {
      this.server.to(`download:${payload.downloadId}`).emit('progress', payload);
    }
  }
}
