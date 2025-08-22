import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NOTIFICATION_TITLE } from '../enum/notification.enum';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  @Prop({ type: Number, required: true })
  userId: number;

  @Prop({
    type: String,
    enum: Object.values(NOTIFICATION_TITLE),
    required: true,
  })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
