import { MEMBER_ROLE, MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsEnum(MESSAGE_TYPE)
  type: MESSAGE_TYPE;

  @IsOptional()
  @IsString()
  text: string;
}

export class EditMessageDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsEnum(MESSAGE_TYPE)
  type: MESSAGE_TYPE;

  @IsString()
  text: string;
}

export class DeleteMessageDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsArray()
  @IsMongoId({ each: true })
  messageIds: string[];
}

export class AddMemberDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsArray()
  @IsInt({ each: true })
  membersToAdd: number[];
}

export class RemoveMemberDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsString()
  @IsMongoId()
  memberToRemove: string;
}

export class ChangeMemberRoleDto {
  @IsString()
  @IsMongoId()
  conversationId: string;

  @IsString()
  @IsMongoId()
  memberId: string;

  @IsEnum(MEMBER_ROLE)
  newRole: MEMBER_ROLE;
}
