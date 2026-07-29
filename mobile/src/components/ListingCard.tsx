import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '@/theme';
import { Listing } from '@/lib/types';

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const photo = listing.photos[0]?.url;
  const price = Math.round(Number(listing.pricePerNight));

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/listing/${listing.id}`)}>
      <View style={styles.photoWrap}>
        {photo && <Image source={{ uri: photo }} style={styles.photo} />}
        <View style={styles.stamp}>
          <Text style={styles.stampPrice}>₺{price}</Text>
          <Text style={styles.stampLabel}>gece</Text>
        </View>
      </View>
      <View style={styles.tear} />
      <View style={styles.body}>
        <Text style={styles.city}>{listing.city.toUpperCase()}</Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {listing.maxGuests} misafir · {listing.bedrooms} oda
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.priceRow}>
            <Text style={styles.priceBold}>₺{price}</Text> / gece
          </Text>
          <Text style={styles.arrow}>İncele →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoWrap: { aspectRatio: 4 / 3, backgroundColor: colors.line, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  stamp: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(18,24,31,0.72)',
    borderWidth: 1.5,
    borderColor: colors.paperRaised,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  stampPrice: { color: colors.paperRaised, fontFamily: fonts.monoMedium, fontSize: 13 },
  stampLabel: { color: colors.paperRaised, fontFamily: fonts.mono, fontSize: 8, opacity: 0.8 },
  tear: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong },
  body: { padding: 16, gap: 4 },
  city: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.cini },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, opacity: 0.6 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceRow: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  priceBold: { fontFamily: fonts.monoMedium, fontSize: 15 },
  arrow: { fontFamily: fonts.mono, fontSize: 12, color: colors.brass },
});
