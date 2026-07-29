import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
  ) {}

  async send(senderId: string, dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver) throw new NotFoundException('Alıcı kullanıcı bulunamadı');

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        listingId: dto.listingId,
        content: dto.content,
      },
    });

    // Alıcı o an bağlıysa (mesajlar ekranı açıksa) anlık olarak iletilir;
    // bağlı değilse zaten bir sonraki REST çağrısında (inbox/conversation) görecek.
    this.messagesGateway.notifyNewMessage(dto.receiverId, message);

    return message;
  }

  // İki kullanıcı arasındaki tüm konuşmayı kronolojik sırayla getirir
  async getConversation(userId: string, otherUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Karşı taraftan gelen okunmamış mesajları okundu olarak işaretle
    await this.prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return messages;
  }

  // Kullanıcının konuştuğu kişilerin listesi (gelen kutusu görünümü için)
  async getInbox(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    // Her karşı taraf için sadece en son mesajı tut
    const byConversation = new Map<string, (typeof messages)[number]>();
    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!byConversation.has(otherId)) {
        byConversation.set(otherId, msg);
      }
    }
    return Array.from(byConversation.values());
  }
}
