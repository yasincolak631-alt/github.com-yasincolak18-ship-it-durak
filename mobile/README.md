# Durak — Mobil (Expo / React Native)

Web istemcisiyle aynı backend'e bağlanan, aynı tasarım kimliğini (İznik mavisi + pirinç
aksan, Spectral/IBM Plex tipografisi, kartpostal/bilet motifi) taşıyan Expo uygulaması.
Expo Router kullanır — dosya tabanlı navigasyon, `web`'deki `app/` klasörüyle aynı zihniyet.

## Kurulum

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Terminalde çıkan QR kodu **Expo Go** uygulamasıyla (App Store / Play Store) okutarak
telefonunda açabilirsin, ya da `i`/`a` tuşlarıyla simülatör/emülatörde çalıştırabilirsin.

**Önemli:** Gerçek bir telefonda test ediyorsan `.env` dosyasındaki
`EXPO_PUBLIC_API_URL` değerini `localhost` yerine bilgisayarının yerel ağ IP'sine
çevirmen gerekir (telefon ile bilgisayar aynı Wi-Fi'da olmalı). IP adresini öğrenmek için:
- Mac/Linux: `ipconfig getifaddr en0` veya `hostname -I`
- Windows: `ipconfig`

## Ekranlar

- **Keşfet** (`(tabs)/index`) — Arama + ilan listesi
- **İlan detayı** (`listing/[id]`) — Fotoğraf, açıklama, değerlendirmeler, rezervasyon formu.
  Rezervasyon oluşturulunca TC kimlik no/adres/şehir istenir (iyzico'nun ödeme formu
  zorunlu tutuyor), ardından iyzico ödeme sayfası tarayıcıda açılır.
- **Rezervasyonlarım** (`(tabs)/trips`) — Durum etiketleri, iptal
- **Mesajlar** (`(tabs)/messages`) — Gelen kutusu + konuşma görünümü, Socket.io ile
  gerçek zamanlı güncelleme (uygulama açıkken yeni mesaj anında görünür)
- **Ev Sahibi** (`(tabs)/host`) — İlan oluşturma (`host/create`, galeriden fotoğraf
  seçip yükleme dahil) ve ödeme ayarları (`host/payments`, IBAN/TC kimlik formu)
- **Profil** (`(tabs)/profile`) — Kullanıcı bilgisi, çıkış yap
- **Giriş / Kayıt** (`login`, `register`) — Token `AsyncStorage`'da saklanır

## Web ile paylaşılan kararlar

- Aynı renk paleti ve tipografi (`src/theme.ts` ↔ web'deki `globals.css`)
- Aynı backend API sözleşmesi (`src/lib/api.ts` ↔ web'deki `lib/api.ts`)
- Şu an tipler ve API çağrıları iki projede ayrı ayrı tutuluyor — büyüdükçe bunları
  paylaşılan bir `packages/shared` paketine taşımak (monorepo, örn. Turborepo) mantıklı olur.

## Sıradaki adımlar

1. Push bildirimleri (yeni mesaj, rezervasyon onayı için `expo-notifications`)
2. Konum bazlı arama (haritada gösterme, `react-native-maps`)
3. Gerçek cihazda dağıtım için EAS Build yapılandırması
4. `socket.io-client` RN'de bazı ortamlarda ek polyfill isteyebilir (`react-native-url-polyfill`) —
   bağlantı sorunu yaşarsan önce onu dene
