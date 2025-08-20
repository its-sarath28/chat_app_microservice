import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

import { CHAT_TYPE, MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @IsMongoId()
  conversationId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsEnum(CHAT_TYPE)
  type: CHAT_TYPE;

  @IsInt()
  createdBy: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  members: number[];
}

export class CreateMessageDto {
  @IsString()
  @IsMongoId()
  conversationId?: string;

  @IsInt()
  sender: number;

  @IsInt()
  receiver: number;

  @IsEnum(CHAT_TYPE)
  type: MESSAGE_TYPE;

  @IsOptional()
  @IsString()
  text?: string;
}
