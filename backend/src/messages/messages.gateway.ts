import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// NOT: Basitlik için kullanıcı kimliği, bağlantı sırasında JWT'den çözülüyor.
// Prodüksiyonda token süresi/geçerliliği için ek hata yönetimi eklenmeli.
@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*' },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      // Her kullanıcı kendi userId'siyle adlandırılmış bir odaya katılır —
      // bu sayede o kullanıcıya özel event'ler kolayca hedeflenebilir.
      client.join(payload.sub);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {
    // Socket.io odadan otomatik çıkarır, ekstra bir şey yapmaya gerek yok.
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: true };
  }

  // MessagesService tarafından, yeni bir mesaj kaydedildiğinde çağrılır.
  notifyNewMessage(receiverId: string, message: unknown) {
    this.server.to(receiverId).emit('new_message', message);
  }
}
