import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MEMBER_ROLE } from '../enum/chat.enum';

@Schema({ timestamps: { createdAt: 'joinedOn', updatedAt: false } })
export class Member extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  userId: number;

  @Prop({
    type: String,
    enum: Object.values(MEMBER_ROLE),
    default: MEMBER_ROLE.MEMBER,
  })
  role: MEMBER_ROLE;

  joinedOn: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
