import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(hostId: string, dto: CreateListingDto) {
    const { photoUrls, ...listingData } = dto;
    return this.prisma.listing.create({
      data: {
        ...listingData,
        hostId,
        photos: photoUrls?.length
          ? { create: photoUrls.map((url, order) => ({ url, order })) }
          : undefined,
      },
      include: { photos: true },
    });
  }

  async search(query: SearchListingDto) {
    const where: any = { isActive: true };

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query.guests) {
      where.maxGuests = { gte: parseInt(query.guests) };
    }
    if (query.minPrice || query.maxPrice) {
      where.pricePerNight = {};
      if (query.minPrice) where.pricePerNight.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.pricePerNight.lte = parseFloat(query.maxPrice);
    }

    // Tarih aralığında müsait olmayan (dolu) ilanları hariç tut
    if (query.checkIn && query.checkOut) {
      where.bookings = {
        none: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          checkIn: { lt: new Date(query.checkOut) },
          checkOut: { gt: new Date(query.checkIn) },
        },
      };
    }

    return this.prisma.listing.findMany({
      where,
      include: { photos: true, host: { select: { id: true, firstName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        photos: true,
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reviews: { include: { author: { select: { firstName: true, avatarUrl: true } } } },
      },
    });
    if (!listing) throw new NotFoundException('İlan bulunamadı');
    return listing;
  }

  async remove(id: string, requesterId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('İlan bulunamadı');
    if (listing.hostId !== requesterId) {
      throw new ForbiddenException('Bu ilanı silme yetkiniz yok');
    }
    return this.prisma.listing.update({ where: { id }, data: { isActive: false } });
  }
}
