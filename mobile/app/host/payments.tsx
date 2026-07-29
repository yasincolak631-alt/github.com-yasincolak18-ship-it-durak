import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '@/theme';
import { onboardPayout, getPayoutStatus } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';

export default function HostPaymentsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<{ onboarded: boolean; hasIban: boolean } | null>(null);
  const [identityNumber, setIdentityNumber] = useState('');
  const [iban, setIban] = useState('');
  const [address, setAddress] = useState('');
  const [gsmNumber, setGsmNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const data = await getPayoutStatus();
        setStatus(data);
      } catch {
        setStatus({ onboarded: false, hasIban: false });
      }
    })();
  }, [router]);

  async function handleSubmit() {
    if (identityNumber.length !== 11) {
      Alert.alert('Eksik bilgi', 'TC kimlik no 11 haneli olmalı.');
      return;
    }
    if (!iban || !address || !gsmNumber) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      await onboardPayout({ identityNumber, iban, address, gsmNumber });
      setStatus({ onboarded: true, hasIban: true });
      Alert.alert('Başarılı', 'Artık ödeme alabilirsiniz.');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Kayıt oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  if (!status) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.cini} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Ödeme Alma</Text>
      <Text style={styles.subtitle}>
        Misafirlerden ödeme alabilmek için IBAN ve kimlik bilgilerinizi kaydedin.
      </Text>

      <View
        style={[
          styles.statusBox,
          { borderColor: status.onboarded ? colors.fig : colors.brass },
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            color: status.onboarded ? colors.fig : colors.brass,
          }}
        >
          {status.onboarded ? 'Ödeme almaya hazır ✓' : 'Henüz kaydedilmedi'}
        </Text>
      </View>

      {!status.onboarded && (
        <>
          <Text style={styles.label}>TC KİMLİK NO</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={11}
            value={identityNumber}
            onChangeText={(v) => setIdentityNumber(v.replace(/\D/g, ''))}
          />

          <Text style={styles.label}>IBAN</Text>
          <TextInput
            style={styles.input}
            placeholder="TR.. .... .... .... .... .... .."
            value={iban}
            onChangeText={setIban}
          />

          <Text style={styles.label}>ADRES</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />

          <Text style={styles.label}>TELEFON</Text>
          <TextInput
            style={styles.input}
            placeholder="+90 5xx xxx xx xx"
            value={gsmNumber}
            onChangeText={setGsmNumber}
          />

          <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitText}>
              {submitting ? 'Kaydediliyor…' : 'Bilgilerimi Kaydet'}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  title: { fontFamily: fonts.display, fontSize: 24, marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, opacity: 0.65, marginBottom: 20, lineHeight: 19 },
  statusBox: { borderWidth: 1, borderRadius: 6, padding: 14, marginBottom: 20 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, opacity: 0.55, marginTop: 14 },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    paddingVertical: 8,
  },
  submitBtn: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 40,
  },
  submitText: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.paper },
});
