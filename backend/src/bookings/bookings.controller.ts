import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  create(@Request() req: { user: { userId: string } }, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Get('me')
  findMine(@Request() req: { user: { userId: string } }) {
    return this.bookingsService.findMyBookings(req.user.userId);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.userId);
  }
}
