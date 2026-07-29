import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts } from '@/theme';
import { getMe } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth-storage';

interface Me {
  firstName: string;
  lastName: string;
  email: string;
  isHost: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        try {
          const data = await getMe();
          setMe(data);
        } catch {
          await clearToken();
          router.replace('/login');
        }
      })();
    }, [router]),
  );

  async function handleLogout() {
    await clearToken();
    router.replace('/login');
  }

  if (!me) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.cini} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{me.firstName[0]}</Text>
      </View>
      <Text style={styles.name}>
        {me.firstName} {me.lastName}
      </Text>
      <Text style={styles.email}>{me.email}</Text>
      {me.isHost && <Text style={styles.hostBadge}>EV SAHİBİ</Text>}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  wrap: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', paddingTop: 64 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.ciniDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitial: { fontFamily: fonts.display, fontSize: 30, color: colors.paperRaised },
  name: { fontFamily: fonts.display, fontSize: 20, marginBottom: 4 },
  email: { fontFamily: fonts.body, fontSize: 13, opacity: 0.6, marginBottom: 10 },
  hostBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.brass,
    borderWidth: 1,
    borderColor: colors.brass,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 32,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.stamp,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 12,
  },
  logoutText: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.stamp },
});
