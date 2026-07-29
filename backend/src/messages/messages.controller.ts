import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@Request() req: { user: { userId: string } }, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.userId, dto);
  }

  @Get('inbox')
  getInbox(@Request() req: { user: { userId: string } }) {
    return this.messagesService.getInbox(req.user.userId);
  }

  @Get('with/:userId')
  getConversation(
    @Request() req: { user: { userId: string } },
    @Param('userId') otherUserId: string,
  ) {
    return this.messagesService.getConversation(req.user.userId, otherUserId);
  }
}
