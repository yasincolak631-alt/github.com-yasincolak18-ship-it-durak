import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts } from '@/theme';
import { createListing, uploadPhoto } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';

export default function CreateListingScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    country: 'Türkiye',
    latitude: '',
    longitude: '',
    pricePerNight: '',
    maxGuests: '2',
    bedrooms: '1',
    bathrooms: '1',
    amenities: '',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri izni vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const uploaded = await uploadPhoto(result.assets[0].uri);
      setPhotoUrl(uploaded.url);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const listing = await createListing({
        title: form.title,
        description: form.description,
        address: form.address,
        city: form.city,
        country: form.country,
        latitude: parseFloat(form.latitude || '0'),
        longitude: parseFloat(form.longitude || '0'),
        pricePerNight: parseFloat(form.pricePerNight || '0'),
        maxGuests: parseInt(form.maxGuests) || 1,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        amenities: form.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        photoUrls: photoUrl ? [photoUrl] : [],
      });
      Alert.alert('Başarılı', 'İlanınız yayınlandı.');
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'İlan oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Yeni İlan</Text>

      <Text style={styles.label}>BAŞLIK</Text>
      <TextInput style={styles.input} value={form.title} onChangeText={(v) => update('title', v)} />

      <Text style={styles.label}>AÇIKLAMA</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={form.description}
        onChangeText={(v) => update('description', v)}
      />

      <Text style={styles.label}>ADRES</Text>
      <TextInput style={styles.input} value={form.address} onChangeText={(v) => update('address', v)} />

      <Text style={styles.label}>ŞEHİR</Text>
      <TextInput style={styles.input} value={form.city} onChangeText={(v) => update('city', v)} />

      <Text style={styles.label}>ENLEM</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="41.0422"
        value={form.latitude}
        onChangeText={(v) => update('latitude', v)}
      />

      <Text style={styles.label}>BOYLAM</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="29.0083"
        value={form.longitude}
        onChangeText={(v) => update('longitude', v)}
      />

      <Text style={styles.label}>GECELİK FİYAT (₺)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.pricePerNight}
        onChangeText={(v) => update('pricePerNight', v)}
      />

      <Text style={styles.label}>MAKS. MİSAFİR</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.maxGuests}
        onChangeText={(v) => update('maxGuests', v)}
      />

      <Text style={styles.label}>OLANAKLAR (virgülle ayırın)</Text>
      <TextInput
        style={styles.input}
        placeholder="Wifi, Mutfak, Klima"
        value={form.amenities}
        onChangeText={(v) => update('amenities', v)}
      />

      <Text style={styles.label}>FOTOĞRAF</Text>
      <Pressable style={styles.photoBtn} onPress={handlePickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.cini} />
        ) : (
          <Text style={{ color: colors.cini, fontFamily: fonts.mono, fontSize: 12 }}>
            {photoUrl ? 'Fotoğrafı Değiştir' : 'Galeriden Seç'}
          </Text>
        )}
      </Pressable>
      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.preview} />}

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Yayınlanıyor…' : 'İlanı Yayınla'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 24, marginBottom: 20 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, opacity: 0.55, marginTop: 14 },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    paddingVertical: 8,
  },
  photoBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.cini,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  preview: { width: '100%', height: 160, borderRadius: 6, marginTop: 12, backgroundColor: colors.line },
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
