import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CHAT_TYPE } from '../enum/chat.enum';

export type ConversationDocument = Conversation & Document;

@Schema()
export class Conversation {
  @Prop({ enum: CHAT_TYPE, default: CHAT_TYPE.DIRECT })
  type: CHAT_TYPE;

  @Prop({ type: String, default: null })
  title: string;

  @Prop({ type: Date })
  lastMessageAt: Date;

  @Prop({ type: String, default: null })
  lastMessage: string;

  @Prop({ type: Number })
  createdBy: number;

  @Prop({ type: Date, default: Date.now })
  createdOn: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
