# Airbnb Benzeri Platform — Backend (MVP)

NestJS + PostgreSQL (Prisma) + iyzico ile yazılmış rezervasyon/kiralama platformu API'si.
Bu backend hem **web** (Next.js) hem **mobil** (React Native) istemcisine aynı anda hizmet verecek şekilde tasarlandı.

> **Not:** Ödeme altyapısı olarak önce Stripe kullanılmıştı, sonra **iyzico'ya geçirildi**.
> Sebep: Stripe, Türkiye'de kurulu şirketlerin banka hesaplarına ödeme aktarmayı
> desteklemiyor — ne platformun kendi hesabı ne de host'ların Connect hesapları
> Türk IBAN'ına bağlanabiliyor. iyzico'nun "Pazaryeri" ürünü, Stripe Connect'in
> Türkiye'de çalışan muadili.

## İçerik

- **Auth**: Kayıt, giriş, JWT
- **Users**: Profil bilgisi
- **Listings**: İlan oluşturma, arama/filtreleme (şehir, tarih, fiyat, misafir sayısı), tarih çakışması kontrolüyle müsaitlik
- **Bookings**: Rezervasyon oluşturma, iptal, tarih çakışma kontrolü, otomatik fiyat hesaplama
- **Reviews**: Sadece check-out tarihi geçmiş ve daha önce yorumlanmamış rezervasyonlar için yorum/puan verme
- **Messages**: Kullanıcılar arası mesajlaşma, gelen kutusu (son mesaja göre gruplanmış), okundu işaretleme
- **Payments (iyzico Pazaryeri)**:
  - Host, IBAN + TC kimlik no + adres bilgisini göndererek "alt üye işyeri" (submerchant) kaydı oluşturur (`POST /payments/payout/onboard`)
  - Misafir rezervasyon isteği oluşturunca `POST /payments/checkout` ile iyzico'nun hosted ödeme sayfasına yönlendirilir
  - Host onboarding'i tamamlamışsa ödeme otomatik olarak `PLATFORM_FEE_PERCENT` komisyonu düşülerek host'un IBAN'ına aktarılır; tamamlamamışsa tutar platform hesabında toplanır (manuel aktarım gerekir)
  - Ödeme sonucu `POST /payments/iyzico-callback` üzerinden doğrulanır (iyzico'nun döndürdüğü `token`, API'den tekrar sorgulanarak teyit edilir — Stripe'daki imza doğrulamalı webhook'tan farklı olarak burada senkron bir doğrulama akışı var)
  - **İade**: Ödenmiş (`CONFIRMED`) bir rezervasyon iptal edilirse, iyzico refund API'si otomatik olarak tetiklenir
- **Uploads**: `POST /uploads` — girişli kullanıcılar JPEG/PNG/WEBP (max 5MB) yükleyebilir, dosya sunucu diskinde `/uploads` altında saklanır ve `/uploads/<dosya>` üzerinden servis edilir
- **Gerçek zamanlı mesajlaşma**: Socket.io ile — bir kullanıcı bağlandığında JWT'sinden çözülen `userId` odasına katılır; yeni mesaj gönderildiğinde alıcı o an bağlıysa `new_message` event'i anlık iletilir (bağlı değilse REST `inbox`/`with/:userId` üzerinden görür)

Henüz eklenmedi: Fotoğraf yükleme prodüksiyonda tek sunucu diskiyle sınırlı (birden fazla instance'a ölçeklenince S3/Cloudinary'e geçmek gerekir), iade başarısız olursa manuel takip mekanizması yok (şimdilik sadece loglanıyor).

## ⚠️ iyzico Pazaryeri erişimi hakkında

"Pazaryeri" (marketplace/split payment) ürünü, iyzico'nun standart self-servis kaydından
otomatik açılmıyor — iyzico'nun **"Bize Ulaşın"** formundan başvurup onlarla görüşmen
gerekiyor (bkz. docs.iyzico.com/urunler/pazaryeri). Bu süreç birkaç gün sürebilir.
Onay gelene kadar sandbox ortamında (`IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`)
geliştirmeye devam edebilirsin; sandbox'ta Pazaryeri servisleri test hesabıyla açık.

## Kurulum

```bash
cd backend
npm install

# .env dosyasını oluştur ve DATABASE_URL'i kendi Postgres bağlantına göre düzenle
cp .env.example .env

# Veritabanı şemasını oluştur
npx prisma migrate dev --name init

# (opsiyonel) örnek veri ekle
npm run prisma:seed

# geliştirme sunucusunu başlat
npm run start:dev
```

Sunucu ayağa kalktığında:
- API: `http://localhost:3000`
- Swagger dokümantasyonu: `http://localhost:3000/docs`

## Yerelde PostgreSQL çalıştırmanın en hızlı yolu (Docker)

```bash
docker run --name airbnb-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=airbnb_clone -p 5432:5432 -d postgres:16
```

## Örnek istekler

**Kayıt ol:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ornek.com","password":"sifre1234","firstName":"Ali","lastName":"Veli"}'
```

**İlan ara:**
```bash
curl "http://localhost:3000/listings?city=İstanbul&guests=2"
```

## iyzico callback'ini yerelde test etme

iyzico, ödeme sonucunu senin sunucuna (`BACKEND_URL`) POST ile bildirir. Yerelde
çalışırken bu adresin dışarıdan erişilebilir olması gerekir — [ngrok](https://ngrok.com)
gibi bir tünelleme aracıyla `localhost:3000`'i dışa açıp, `.env` dosyasındaki
`BACKEND_URL`'i o tünel adresine ayarla:

```bash
ngrok http 3000
# BACKEND_URL="https://xxxx.ngrok-free.app"
```

## Sıradaki adımlar (önerilen sıra)

1. iyzico Pazaryeri başvurusunu tamamla (bkz. yukarıdaki uyarı) — onaysız gerçek ödeme alınamaz
2. Fotoğraf yükleme için S3/Cloudinary entegrasyonu (şu an yerel disk — çoklu instance'ta çalışmaz)
3. Mobilde ev sahibi paneli (ilan oluşturma + iyzico onboarding, şu an sadece web'de var)
4. Web ile mobil arasında paylaşılan bir `shared` paketi (TypeScript tipleri, API client, validasyon şemaları)
5. İade başarısız olduğunda yeniden deneme/manuel takip mekanizması
