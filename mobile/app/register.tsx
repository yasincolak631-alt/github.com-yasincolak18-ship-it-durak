import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { colors, fonts } from '@/theme';
import { register } from '@/lib/api';
import { saveToken } from '@/lib/auth-storage';

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const { accessToken } = await register({ firstName, lastName, email, password });
      await saveToken(accessToken);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Kayıt başarısız', err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
      <Text style={styles.eyebrow}>ARAMIZA KATILIN</Text>
      <Text style={styles.title}>Kayıt Ol</Text>

      <Text style={styles.label}>AD</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
      <Text style={styles.label}>SOYAD</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
      <Text style={styles.label}>E-POSTA</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>ŞİFRE</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

      <Pressable style={styles.btn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}</Text>
      </Pressable>

      <Link href="/login" style={styles.switchLink}>
        Zaten hesabınız var mı? Giriş yapın
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.cini, marginBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 28, marginBottom: 32 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, opacity: 0.55, marginTop: 16 },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lineStrong,
    paddingVertical: 8,
  },
  btn: { backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 32 },
  btnText: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.paper },
  switchLink: { fontFamily: fonts.body, textAlign: 'center', marginTop: 22, marginBottom: 40, color: colors.cini },
});
