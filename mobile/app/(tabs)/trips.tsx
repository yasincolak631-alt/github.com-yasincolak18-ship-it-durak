import { useCallback, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts, statusColors, statusLabels } from '@/theme';
import { getMyBookings, cancelBooking } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';
import { Booking } from '@/lib/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function TripsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        try {
          const data = await getMyBookings();
          if (active) setBookings(data);
        } catch (err) {
          if (active) setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
      })();
      return () => {
        active = false;
      };
    }, [router]),
  );

  async function handleCancel(id: string) {
    await cancelBooking(id);
    setBookings((prev) => prev?.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)) ?? null);
  }

  if (!bookings && !error) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.cini} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 20 }}
      data={bookings ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text style={styles.title}>Rezervasyonlarım</Text>}
      ListEmptyComponent={<Text style={styles.empty}>Henüz bir rezervasyonunuz yok.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          {item.listing.photos[0] && (
            <Image source={{ uri: item.listing.photos[0].url }} style={styles.photo} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.tripTitle}>{item.listing.title}</Text>
            <Text style={styles.tripMeta}>
              {formatDate(item.checkIn)} — {formatDate(item.checkOut)} · ₺
              {Math.round(Number(item.totalPrice))}
            </Text>
            <View style={[styles.statusChip, { backgroundColor: `${statusColors[item.status]}22` }]}>
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                {statusLabels[item.status]}
              </Text>
            </View>
          </View>
          {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
            <Pressable onPress={() => handleCancel(item.id)}>
              <Text style={styles.cancelLink}>İptal et</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  title: { fontFamily: fonts.display, fontSize: 24, marginBottom: 20 },
  empty: { fontFamily: fonts.body, opacity: 0.6 },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lineStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  photo: { width: 76, height: 58, borderRadius: 4, backgroundColor: colors.line },
  tripTitle: { fontFamily: fonts.display, fontSize: 15, marginBottom: 3 },
  tripMeta: { fontFamily: fonts.mono, fontSize: 11, opacity: 0.6, marginBottom: 6 },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  cancelLink: { fontFamily: fonts.mono, fontSize: 11, color: colors.stamp },
});
