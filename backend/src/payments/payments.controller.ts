import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateCheckoutFormDto } from './dto/create-checkout-form.dto';
import { OnboardPayoutDto } from './dto/onboard-payout.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Host'un ödeme alabilmesi için iyzico alt üye işyeri kaydını oluşturur/günceller
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('payout/onboard')
  onboardPayout(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: OnboardPayoutDto,
  ) {
    return this.paymentsService.onboardPayout(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('payout/status')
  getPayoutStatus(@Req() req: Request & { user: { userId: string } }) {
    return this.paymentsService.getPayoutStatus(req.user.userId);
  }

  // Misafiri iyzico'nun hosted ödeme sayfasına yönlendirecek URL'i oluşturur
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckoutForm(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: CreateCheckoutFormDto,
  ) {
    return this.paymentsService.createCheckoutForm(req.user.userId, dto, req.ip || '');
  }

  // iyzico, ödeme tamamlandığında misafirin tarayıcısını bu adrese POST ile yönlendirir.
  // Token'ı iyzico'nun API'sinden tekrar sorgulayıp doğruladıktan sonra web'e geri yönlendiriyoruz.
  @Post('iyzico-callback')
  async handleCallback(@Body('token') token: string, @Res() res: Response) {
    const result = await this.paymentsService.handleCallback(token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    if (result.success) {
      res.redirect(302, `${frontendUrl}/booking-success?booking_id=${result.bookingId}`);
    } else {
      res.redirect(302, `${frontendUrl}/booking-cancelled?booking_id=${result.bookingId || ''}`);
    }
  }
}
