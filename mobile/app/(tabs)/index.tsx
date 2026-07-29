import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts } from '@/theme';
import { searchListings } from '@/lib/api';
import { Listing } from '@/lib/types';
import { ListingCard } from '@/components/ListingCard';

export default function DiscoverScreen() {
  const [city, setCity] = useState('');
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback((cityFilter?: string) => {
    searchListings(cityFilter ? { city: cityFilter } : {})
      .then(setListings)
      .catch((err) => setError(err.message));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>YEREL BİR KAPI ÇALIN</Text>
            <Text style={styles.heroTitle}>
              Otel değil,{'\n'}
              <Text style={{ color: colors.brassBright, fontStyle: 'italic' }}>bir yer edin.</Text>
            </Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>NEREYE</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="İstanbul, Kaş, Kapadokya…"
              placeholderTextColor="rgba(18,24,31,0.35)"
              value={city}
              onChangeText={setCity}
              onSubmitEditing={() => load(city)}
              returnKeyType="search"
            />
            <Pressable style={styles.searchBtn} onPress={() => load(city)}>
              <Text style={styles.searchBtnText}>ARA</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            {city ? `${city} için sonuçlar` : 'Öne çıkan duraklar'}
          </Text>
          {error !== '' && <Text style={{ color: colors.stamp, marginBottom: 12 }}>{error}</Text>}
          {!listings && !error && <ActivityIndicator color={colors.cini} style={{ marginTop: 20 }} />}
        </>
      }
      data={listings ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 20 }}>
          <ListingCard listing={item} />
        </View>
      )}
      ListEmptyComponent={
        listings && listings.length === 0 ? (
          <Text style={{ opacity: 0.6, fontFamily: fonts.body }}>
            Bu kriterlere uyan bir yer bulamadık.
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 40, paddingHorizontal: 0 },
  hero: {
    backgroundColor: colors.ciniDeep,
    paddingTop: 32,
    paddingBottom: 64,
    paddingHorizontal: 20,
  },
  heroEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.brassBright,
    marginBottom: 12,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.paperRaised },
  searchCard: {
    backgroundColor: colors.paperRaised,
    marginHorizontal: 20,
    marginTop: -32,
    borderRadius: 6,
    padding: 18,
    shadowColor: colors.ciniDeep,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    marginBottom: 28,
  },
  searchLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, opacity: 0.55, marginBottom: 6 },
  searchInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    paddingBottom: 10,
    marginBottom: 14,
  },
  searchBtn: { backgroundColor: colors.stamp, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  searchBtnText: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.paperRaised },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginHorizontal: 20,
    marginBottom: 16,
  },
});
