import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async create(guestId: string, dto: CreateBookingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing || !listing.isActive) {
      throw new NotFoundException('İlan bulunamadı');
    }

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Çıkış tarihi, giriş tarihinden sonra olmalı');
    }
    if (dto.guestCount > listing.maxGuests) {
      throw new BadRequestException(
        `Bu ilan en fazla ${listing.maxGuests} misafir kabul ediyor`,
      );
    }

    // Tarih çakışması kontrolü — aynı ilan için çakışan onaylı/bekleyen rezervasyon var mı?
    const conflict = await this.prisma.booking.findFirst({
      where: {
        listingId: dto.listingId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
    if (conflict) {
      throw new BadRequestException('Seçilen tarihler için ilan müsait değil');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(listing.pricePerNight) * nights;

    return this.prisma.booking.create({
      data: {
        listingId: dto.listingId,
        guestId,
        checkIn,
        checkOut,
        guestCount: dto.guestCount,
        totalPrice,
        status: 'PENDING',
      },
      include: { listing: true },
    });
  }

  async findMyBookings(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId },
      include: { listing: { include: { photos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: string, requesterId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Rezervasyon bulunamadı');
    if (booking.guestId !== requesterId) {
      throw new ForbiddenException('Bu rezervasyonu iptal etme yetkiniz yok');
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Bu rezervasyon iptal edilemez');
    }

    // Ödeme zaten alınmışsa (CONFIRMED), iptal öncesinde iyzico üzerinden iade dene.
    // İade başarısız olsa bile iptal işlemi engellenmez — durum kaydedilir, iade
    // manuel takip gerektirebilir (üretimde bir "iade beklemede" alanı eklenmeli).
    let refundInfo: { refunded: boolean; reason?: string } | null = null;
    if (booking.status === 'CONFIRMED') {
      refundInfo = await this.paymentsService.refundBooking(id);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { ...updated, refund: refundInfo };
  }

  // Ödeme sağlayıcısından (iyzico callback) onay geldiğinde çağrılabilir.
  // Not: Şu an PaymentsService, ödeme onayını doğrudan Prisma üzerinden yapıyor;
  // bu metot ileride bookings modülü içinden de tetiklenmek istenirse kullanılabilir.
  async confirm(id: string, iyzicoPaymentId: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED', iyzicoPaymentId },
    });
  }
}
