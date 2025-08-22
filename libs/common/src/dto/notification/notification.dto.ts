import { NOTIFICATION_TITLE } from 'apps/notification/enum/notification.enum';
import { IsEnum, IsInt, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsEnum(NOTIFICATION_TITLE)
  title: NOTIFICATION_TITLE;

  @IsString()
  description: string;
}
