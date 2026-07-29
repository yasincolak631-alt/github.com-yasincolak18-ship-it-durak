import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { colors, fonts } from '@/theme';
import { getInbox, getConversation, sendMessage, getMe } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Person {
  id: string;
  firstName: string;
}
interface InboxEntry {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sender: Person;
  receiver: Person;
}
interface Message {
  id: string;
  content: string;
  senderId: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [inbox, setInbox] = useState<InboxEntry[] | null>(null);
  const [activeUser, setActiveUser] = useState<Person | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const activeUserRef = useRef<Person | null>(null);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Socket bağlantısı sekme odaktan çıksa da açık kalsın diye ayrı bir effect'te,
  // bileşen mount olduğunda bir kere kurulur.
  useEffect(() => {
    let socket: Socket | undefined;
    (async () => {
      const token = await getToken();
      if (!token) return;
      socket = io(API_BASE, { auth: { token } });
      socket.on('new_message', (message: Message & { senderId: string }) => {
        if (activeUserRef.current && message.senderId === activeUserRef.current.id) {
          setConversation((prev) => [...prev, message]);
        }
        getInbox().then(setInbox).catch(() => {});
      });
    })();
    return () => {
      socket?.disconnect();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        const me = await getMe();
        setMyId(me.id);
        const inboxData = await getInbox();
        setInbox(inboxData);
      })();
    }, [router]),
  );

  async function openConversation(entry: InboxEntry) {
    if (!myId) return;
    const other = entry.senderId === myId ? entry.receiver : entry.sender;
    setActiveUser(other);
    const data = await getConversation(other.id);
    setConversation(data);
  }

  async function handleSend() {
    if (!activeUser || !draft.trim()) return;
    const sent = await sendMessage(activeUser.id, draft);
    setConversation((prev) => [...prev, sent]);
    setDraft('');
  }

  if (activeUser) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.paper }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.convHeader}>
          <Pressable onPress={() => setActiveUser(null)}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.convHeaderText}>{activeUser.firstName}</Text>
        </View>
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={conversation}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.senderId === myId ? styles.bubbleMine : styles.bubbleTheirs,
              ]}
            >
              <Text style={item.senderId === myId ? { color: colors.paperRaised } : { color: colors.ink }}>
                {item.content}
              </Text>
            </View>
          )}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Mesaj yaz…"
            value={draft}
            onChangeText={setDraft}
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={16} color={colors.paperRaised} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 20 }}
      ListHeaderComponent={<Text style={styles.title}>Mesajlar</Text>}
      data={inbox ?? []}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        inbox ? (
          <Text style={{ opacity: 0.6, fontFamily: fonts.body }}>Henüz bir mesajınız yok.</Text>
        ) : (
          <ActivityIndicator color={colors.cini} />
        )
      }
      renderItem={({ item }) => {
        const other = item.senderId === myId ? item.receiver : item.sender;
        return (
          <Pressable style={styles.inboxRow} onPress={() => openConversation(item)}>
            <Text style={styles.inboxName}>{other.firstName}</Text>
            <Text style={styles.inboxPreview} numberOfLines={1}>
              {item.content}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 24, marginBottom: 20 },
  inboxRow: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, borderStyle: 'dashed' },
  inboxName: { fontFamily: fonts.bodyMedium, fontSize: 15, marginBottom: 2 },
  inboxPreview: { fontFamily: fonts.body, fontSize: 13, opacity: 0.6 },
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.paperRaised,
  },
  convHeaderText: { fontFamily: fonts.display, fontSize: 17 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 12, marginBottom: 10 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.cini },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.line },
  composer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paperRaised,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.body,
  },
  sendBtn: { backgroundColor: colors.ink, borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
