import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { CreateNotificationDto } from '@app/common/dto/notification/notification.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(PATTERN.NOTIFICATION.CREATE_NEW_NOTIFICATION)
  newNotification(@Payload() data: CreateNotificationDto & { event?: string }) {
    return this.notificationService.createNotification(data, data?.event);
  }
}
