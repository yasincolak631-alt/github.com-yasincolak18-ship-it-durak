import { IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  receiverId: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsString()
  content: string;
}
