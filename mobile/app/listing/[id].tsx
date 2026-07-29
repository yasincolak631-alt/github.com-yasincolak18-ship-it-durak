import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors, fonts } from '@/theme';
import { getListing, createBooking, createCheckoutForm } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';
import { ListingDetail } from '@/lib/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // Rezervasyon oluşturulduktan sonra iyzico ödeme formu için gereken bilgiler
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [identityNumber, setIdentityNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (id) getListing(id).then(setListing).catch(() => setListing(null));
  }, [id]);

  if (!listing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.cini} />
      </View>
    );
  }

  const price = Math.round(Number(listing.pricePerNight));
  const photo = listing.photos[0]?.url;

  async function handleCreateBooking() {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Eksik bilgi', 'Lütfen giriş ve çıkış tarihini YYYY-AA-GG formatında girin.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        listingId: listing!.id,
        checkIn,
        checkOut,
        guestCount: parseInt(guestCount) || 1,
      });
      setBookingId(booking.id);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (!bookingId) return;
    if (identityNumber.length !== 11 || !address || !city) {
      Alert.alert('Eksik bilgi', 'TC kimlik no 11 haneli olmalı, adres ve şehir zorunlu.');
      return;
    }
    setSubmitting(true);
    try {
      const checkout = await createCheckoutForm({ bookingId, identityNumber, address, city });
      await WebBrowser.openBrowserAsync(checkout.url);
      router.push('/(tabs)/trips');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }}>
      {photo && <Image source={{ uri: photo }} style={styles.photo} />}

      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {listing.city}, {listing.country}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {listing.maxGuests} misafir · {listing.bedrooms} oda · {listing.bathrooms} banyo
        </Text>

        <Text style={styles.description}>{listing.description}</Text>

        {listing.amenities.length > 0 && (
          <View style={styles.chipRow}>
            {listing.amenities.map((a) => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bookingCard}>
          <Text style={styles.bookingPrice}>
            ₺{price} <Text style={styles.bookingPriceUnit}>/ gece</Text>
          </Text>

          {!bookingId ? (
            <>
              <Text style={styles.fieldLabel}>GİRİŞ (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-08-10"
                value={checkIn}
                onChangeText={setCheckIn}
              />
              <Text style={styles.fieldLabel}>ÇIKIŞ (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-08-13"
                value={checkOut}
                onChangeText={setCheckOut}
              />
              <Text style={styles.fieldLabel}>MİSAFİR SAYISI</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={guestCount}
                onChangeText={setGuestCount}
              />

              <Pressable style={styles.bookBtn} onPress={handleCreateBooking} disabled={submitting}>
                <Text style={styles.bookBtnText}>
                  {submitting ? 'Gönderiliyor…' : 'Rezervasyon İste'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.bookingNoteText}>
                Son adım: iyzico güvenli ödeme formu için kimlik/adres bilgisi gerekiyor.
              </Text>
              <Text style={styles.fieldLabel}>TC KİMLİK NO</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                maxLength={11}
                value={identityNumber}
                onChangeText={(v) => setIdentityNumber(v.replace(/\D/g, ''))}
              />
              <Text style={styles.fieldLabel}>ADRES</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} />
              <Text style={styles.fieldLabel}>ŞEHİR</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />

              <Pressable style={styles.bookBtn} onPress={handlePay} disabled={submitting}>
                <Text style={styles.bookBtnText}>
                  {submitting ? 'Yönlendiriliyor…' : 'Ödemeye Geç'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {listing.reviews.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
            {listing.reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <Text style={{ color: colors.brass, fontFamily: fonts.mono }}>
                  {'★'.repeat(review.rating)}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, marginTop: 4 }}>
                  {review.author.firstName}
                </Text>
                {review.comment && (
                  <Text style={{ opacity: 0.75, marginTop: 2 }}>{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  photo: { width: '100%', aspectRatio: 16 / 10 },
  body: { padding: 20 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.cini, marginBottom: 6 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 6 },
  meta: { fontFamily: fonts.body, fontSize: 13, opacity: 0.6, marginBottom: 20 },
  description: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, opacity: 0.85 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  chip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.mono, fontSize: 11 },
  bookingCard: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 6,
    padding: 20,
    backgroundColor: colors.paperRaised,
  },
  bookingPrice: { fontFamily: fonts.monoMedium, fontSize: 22, marginBottom: 16 },
  bookingPriceUnit: { fontFamily: fonts.mono, fontSize: 13, opacity: 0.6 },
  bookingNoteText: { fontFamily: fonts.body, fontSize: 12, opacity: 0.6, marginBottom: 8 },
  fieldLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, opacity: 0.55, marginTop: 12 },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    paddingVertical: 8,
  },
  bookBtn: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  bookBtnText: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.paper },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: 12 },
  reviewItem: { borderTopWidth: 1, borderTopColor: colors.line, borderStyle: 'dashed', paddingVertical: 14 },
});
