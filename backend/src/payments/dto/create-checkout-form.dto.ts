import { IsString, Length } from 'class-validator';

export class CreateCheckoutFormDto {
  @IsString()
  bookingId: string;

  // iyzico ödeme formu, kart sahibinin kimlik/adres bilgisini zorunlu tutar
  // (dolandırıcılık önleme mevzuatı gereği). Bu yüzden Stripe'daki gibi tek
  // alanlı bir istekle yetinemiyoruz.
  @IsString()
  @Length(11, 11, { message: 'TC kimlik no 11 haneli olmalı' })
  identityNumber: string;

  @IsString()
  address: string;

  @IsString()
  city: string;
}
