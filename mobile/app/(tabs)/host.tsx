import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/theme';

export default function HostTabScreen() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Ev Sahibi</Text>
      <Text style={styles.subtitle}>Yerini paylaş, ödemelerini yönet.</Text>

      <Pressable style={styles.card} onPress={() => router.push('/host/create')}>
        <Ionicons name="add-circle-outline" size={24} color={colors.cini} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Yeni İlan Oluştur</Text>
          <Text style={styles.cardMeta}>Fotoğraf, fiyat ve detaylarını gir</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.lineStrong} />
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/host/payments')}>
        <Ionicons name="card-outline" size={24} color={colors.cini} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Ödeme Alma</Text>
          <Text style={styles.cardMeta}>IBAN ve kimlik bilgilerini kaydet</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.lineStrong} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.paper, padding: 20, paddingTop: 32 },
  title: { fontFamily: fonts.display, fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, opacity: 0.6, marginBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: { fontFamily: fonts.bodyMedium, fontSize: 15, marginBottom: 2 },
  cardMeta: { fontFamily: fonts.body, fontSize: 12, opacity: 0.6 },
});
