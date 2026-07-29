import { IsString, Length } from 'class-validator';

export class OnboardPayoutDto {
  @IsString()
  @Length(11, 11, { message: 'TC kimlik no 11 haneli olmalı' })
  identityNumber: string;

  @IsString()
  iban: string;

  @IsString()
  address: string;

  @IsString()
  gsmNumber: string;
}
