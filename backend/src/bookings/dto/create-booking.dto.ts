import { IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  listingId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsNumber()
  @Min(1)
  guestCount: number;
}
