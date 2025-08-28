import { MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class NewMessagePayloadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsNumber()
  sender: number;

  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  text?: string;
}
