import { CreateNotificationDto } from '@app/common/dto/notification/notification.dto';
import { PATTERN } from '@app/common/pattern/pattern';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from '../schema/notification.schema';
import { Model } from 'mongoose';
import { SOCKET_CLIENT } from '@app/common/token/token';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @Inject(SOCKET_CLIENT)
    private wsClient: ClientProxy,
  ) {}

  async createNotification(
    @Payload() data: CreateNotificationDto,
    event?: string,
  ) {
    const notification: Notification =
      await this.notificationModel.create(data);

    if (event) {
      this.wsClient.emit(PATTERN.NOTIFICATION.NOTIFY_USER, {
        userId: data.userId.toString(),
        event,
        payload: {
          title: notification.title,
          description: notification.description,
        },
      });
    }
  }
}
