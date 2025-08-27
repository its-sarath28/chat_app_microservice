import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MESSAGE_TYPE } from '../enum/chat.enum';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  sender: number;

  // @Prop({ type: Number, required: true })
  // receiver: number;

  @Prop({ type: String, enum: Object.values(MESSAGE_TYPE), required: true })
  type: MESSAGE_TYPE;

  @Prop({ type: String, default: null })
  text?: string;

  @Prop({ type: String, default: null })
  mediaUrl?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Boolean, default: false })
  isEdited: Boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: Boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
