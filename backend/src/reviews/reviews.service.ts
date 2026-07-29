import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { listing: true, review: true },
    });

    if (!booking) throw new NotFoundException('Rezervasyon bulunamadı');
    if (booking.guestId !== authorId) {
      throw new ForbiddenException('Sadece kendi rezervasyonunuz için yorum yapabilirsiniz');
    }
    if (booking.review) {
      throw new ConflictException('Bu rezervasyon için zaten bir yorum yapılmış');
    }
    // Sadece check-out tarihi geçmiş rezervasyonlar değerlendirilebilir
    if (new Date(booking.checkOut) > new Date()) {
      throw new BadRequestException('Konaklama tamamlanmadan yorum yapılamaz');
    }

    return this.prisma.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        authorId,
        targetId: booking.listing.hostId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async findForListing(listingId: string) {
    return this.prisma.review.findMany({
      where: { listingId },
      include: { author: { select: { firstName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
