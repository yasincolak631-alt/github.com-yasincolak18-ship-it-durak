import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import Iyzipay from 'iyzipay';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardPayoutDto } from './dto/onboard-payout.dto';
import { CreateCheckoutFormDto } from './dto/create-checkout-form.dto';

// Platformun her rezervasyondan aldığı hizmet bedeli (host'a aktarılan tutardan düşülür)
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || '10');

@Injectable()
export class PaymentsService {
  private iyzipay: Iyzipay;
  private frontendUrl: string;
  private backendUrl: string;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    if (!apiKey || !secretKey) {
      console.warn(
        '[payments] IYZICO_API_KEY / IYZICO_SECRET_KEY tanımlı değil — ödeme endpoint\'leri çalışmayacak.',
      );
    }
    this.iyzipay = new Iyzipay({
      apiKey: apiKey || 'sandbox-placeholder',
      secretKey: secretKey || 'sandbox-placeholder',
      // Canlıya geçerken IYZICO_BASE_URL'i https://api.iyzipay.com yap
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }

  // --- Host onboarding: iyzico'da "alt üye işyeri" (submerchant) kaydı oluşturur ---
  async onboardPayout(hostId: string, dto: OnboardPayoutDto) {
    const user = await this.prisma.user.findUnique({ where: { id: hostId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: hostId,
      subMerchantExternalId: hostId,
      subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.PERSONAL,
      address: dto.address,
      iban: dto.iban,
      contactName: user.firstName,
      contactSurname: user.lastName,
      email: user.email,
      gsmNumber: dto.gsmNumber,
      name: `${user.firstName} ${user.lastName}`,
      identityNumber: dto.identityNumber,
      currency: 'TRY',
    };

    const result = await new Promise<any>((resolve, reject) => {
      this.iyzipay.subMerchant.create(request, (err, res) => (err ? reject(err) : resolve(res)));
    });

    if (result.status !== 'success') {
      throw new BadRequestException(result.errorMessage || 'Alt üye işyeri kaydı oluşturulamadı');
    }

    await this.prisma.user.update({
      where: { id: hostId },
      data: {
        iyzicoSubMerchantKey: result.subMerchantKey,
        iyzicoOnboarded: true,
        iban: dto.iban,
        identityNumber: dto.identityNumber,
        isHost: true,
        role: 'HOST',
      },
    });

    return { onboarded: true };
  }

  async getPayoutStatus(hostId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: hostId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return {
      onboarded: user.iyzicoOnboarded,
      hasIban: Boolean(user.iban),
    };
  }

  // --- Ödeme: iyzico Checkout Form ile misafiri hosted ödeme sayfasına yönlendirir ---
  async createCheckoutForm(
    guestId: string,
    dto: CreateCheckoutFormDto,
    buyerIp: string,
  ): Promise<{ url: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { listing: { include: { host: true } }, guest: true },
    });

    if (!booking) throw new NotFoundException('Rezervasyon bulunamadı');
    if (booking.guestId !== guestId) {
      throw new ForbiddenException('Bu rezervasyon için ödeme başlatma yetkiniz yok');
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Bu rezervasyon zaten işleme alınmış');
    }

    // Alıcı bilgilerini rezervasyona kaydet (kayıt tutma + iade süreçlerinde lazım olur)
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        buyerIdentityNumber: dto.identityNumber,
        buyerAddress: dto.address,
        buyerCity: dto.city,
      },
    });

    const totalPrice = Number(booking.totalPrice);
    const host = booking.listing.host;
    const usesMarketplaceSplit = Boolean(host.iyzicoOnboarded && host.iyzicoSubMerchantKey);
    const hostAmount = usesMarketplaceSplit
      ? (totalPrice * (100 - PLATFORM_FEE_PERCENT)) / 100
      : totalPrice;

    const basketItem: Record<string, any> = {
      id: booking.listingId,
      name: booking.listing.title,
      category1: 'Konaklama',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: totalPrice.toFixed(2),
    };
    // Host onboarding'i tamamlamışsa doğrudan ödeme bölünerek host'a aktarılır.
    // Tamamlamamışsa tutar platform hesabında toplanır (manuel aktarım gerekir).
    if (usesMarketplaceSplit) {
      basketItem.subMerchantKey = host.iyzicoSubMerchantKey;
      basketItem.subMerchantPrice = hostAmount.toFixed(2);
    }

    const guest = booking.guest;
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: booking.id,
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: booking.id,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${this.backendUrl}/payments/iyzico-callback`,
      buyer: {
        id: guest.id,
        name: guest.firstName,
        surname: guest.lastName,
        gsmNumber: guest.phone || '+905000000000',
        email: guest.email,
        identityNumber: dto.identityNumber,
        registrationAddress: dto.address,
        ip: buyerIp || '127.0.0.1',
        city: dto.city,
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: `${guest.firstName} ${guest.lastName}`,
        city: dto.city,
        country: 'Turkey',
        address: dto.address,
      },
      billingAddress: {
        contactName: `${guest.firstName} ${guest.lastName}`,
        city: dto.city,
        country: 'Turkey',
        address: dto.address,
      },
      basketItems: [basketItem],
    };

    const result = await new Promise<any>((resolve, reject) => {
      this.iyzipay.checkoutFormInitialize.create(request, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });

    if (result.status !== 'success') {
      throw new BadRequestException(result.errorMessage || 'Ödeme formu oluşturulamadı');
    }

    return { url: result.paymentPageUrl };
  }

  // --- iyzico'nun callbackUrl'e yönlendirdiği token ile ödeme sonucunu doğrular ---
  async handleCallback(token: string): Promise<{ success: boolean; bookingId?: string }> {
    if (!token) return { success: false };

    const result = await new Promise<any>((resolve, reject) => {
      this.iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, conversationId: token, token },
        (err, res) => (err ? reject(err) : resolve(res)),
      );
    });

    const bookingId: string | undefined = result.basketId;
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS' && bookingId) {
      const transactionId = result.itemTransactions?.[0]?.paymentTransactionId;
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          iyzicoPaymentId: result.paymentId,
          iyzicoTransactionId: transactionId,
        },
      });
      return { success: true, bookingId };
    }
    return { success: false, bookingId };
  }

  // --- Rezervasyon iptal edildiğinde, ödeme zaten alınmışsa iyzico üzerinden iade başlatır ---
  async refundBooking(bookingId: string): Promise<{ refunded: boolean; reason?: string }> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Rezervasyon bulunamadı');

    if (!booking.iyzicoTransactionId) {
      // Ödeme hiç alınmamış (rezervasyon PENDING'ken iptal edilmiş) — iade edilecek bir şey yok
      return { refunded: false, reason: 'Ödeme kaydı bulunamadı, iade gerekmiyor' };
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: bookingId,
      paymentTransactionId: booking.iyzicoTransactionId,
      price: Number(booking.totalPrice).toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      ip: '127.0.0.1',
    };

    const result = await new Promise<any>((resolve, reject) => {
      this.iyzipay.refund.create(request, (err, res) => (err ? reject(err) : resolve(res)));
    });

    if (result.status !== 'success') {
      return { refunded: false, reason: result.errorMessage || 'İade başarısız oldu' };
    }
    return { refunded: true };
  }
}
