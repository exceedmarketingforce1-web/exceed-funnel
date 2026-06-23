import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const ACTIVITY_META = {
  coffee: { emoji: '☕', label: 'Coffee', color: '#92400E', bg: '#FEF3C7' },
  happyHour: { emoji: '🍸', label: 'Happy Hour', color: '#7C3AED', bg: '#EDE9FE' },
  casualBites: { emoji: '🌮', label: 'Casual Bites', color: '#D97706', bg: '#FEF9C3' },
};

const INITIAL_CHATS = [
  {
    id: '1',
    name: 'Sophia',
    age: 28,
    neighborhood: 'Midtown',
    activity: 'coffee',
    initials: 'S',
    avatarColor: '#FFB3C6',
    startedAt: Date.now() - 25 * 60 * 1000,
    confirmed: false,
    locked: false,
    messages: [
      { id: 'm1', from: 'them', text: 'Hey! Saw you were free for coffee too 👋', ts: Date.now() - 24 * 60 * 1000 },
      { id: 'm2', from: 'me', text: 'Hey Sophia! Yes, I\'m in Midtown right now actually', ts: Date.now() - 23 * 60 * 1000 },
      { id: 'm3', from: 'them', text: 'Perfect! There\'s a great spot on 5th. You free in like 30 mins?', ts: Date.now() - 20 * 60 * 1000 },
    ],
  },
  {
    id: '2',
    name: 'Marcus',
    age: 31,
    neighborhood: 'Downtown',
    activity: 'happyHour',
    initials: 'M',
    avatarColor: '#C4B5FD',
    startedAt: Date.now() - 90 * 60 * 1000,
    confirmed: false,
    locked: false,
    messages: [
      { id: 'm1', from: 'them', text: 'Happy hour sounds like exactly what I need tonight', ts: Date.now() - 89 * 60 * 1000 },
      { id: 'm2', from: 'me', text: 'Same! Any preference on spots downtown?', ts: Date.now() - 85 * 60 * 1000 },
    ],
  },
];

function formatTime(ms) {
  if (ms <= 0) return '0:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTimerColor(ms) {
  if (ms <= 30 * 60 * 1000) return colors.danger;
  if (ms <= 60 * 60 * 1000) return colors.warning;
  return colors.success;
}

// ─── Chat Detail View ────────────────────────────────────────────────────────

function ChatDetail({ chat, onBack, onUpdateChat }) {
  const [messages, setMessages] = useState(chat.messages);
  const [inputText, setInputText] = useState('');
  const [confirmed, setConfirmed] = useState(chat.confirmed);
  const [locked, setLocked] = useState(chat.locked);
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt))
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (confirmed || locked) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setLocked(true);
        onUpdateChat(chat.id, { locked: true });
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmed, locked]);

  useEffect(() => {
    if (!confirmed && !locked && timeLeft < 30 * 60 * 1000) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [timeLeft, confirmed, locked]);

  const handleSend = () => {
    if (!inputText.trim() || locked) return;
    const newMsg = {
      id: `m${Date.now()}`,
      from: 'me',
      text: inputText.trim(),
      ts: Date.now(),
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onUpdateChat(chat.id, { messages: updated });
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Meetup? 🎉',
      `Lock in your ${ACTIVITY_META[chat.activity].label} with ${chat.name}!`,
      [
        {
          text: 'Yes, Let\'s Go!',
          onPress: () => {
            setConfirmed(true);
            const sysMsg = {
              id: `m${Date.now()}`,
              from: 'system',
              text: `Meetup confirmed! Enjoy your ${ACTIVITY_META[chat.activity].emoji} ${ACTIVITY_META[chat.activity].label}.`,
              ts: Date.now(),
            };
            const updated = [...messages, sysMsg];
            setMessages(updated);
            onUpdateChat(chat.id, { confirmed: true, messages: updated });
          },
        },
        { text: 'Not Yet', style: 'cancel' },
      ]
    );
  };

  const timerColor = getTimerColor(timeLeft);
  const activity = ACTIVITY_META[chat.activity];
  const isUrgent = timeLeft < 30 * 60 * 1000 && !confirmed && !locked;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.chatContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={[styles.chatAvatar, { backgroundColor: chat.avatarColor }]}>
            <Text style={styles.chatAvatarText}>{chat.initials}</Text>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{chat.name}, {chat.age}</Text>
            <View style={styles.chatHeaderSub}>
              <Text style={styles.chatHeaderActivity}>{activity.emoji} {activity.label}</Text>
              <Text style={styles.chatHeaderDot}> · </Text>
              <Text style={styles.chatHeaderNeighborhood}>{chat.neighborhood}</Text>
            </View>
          </View>
        </View>

        {/* Timer Banner */}
        {!confirmed && !locked && (
          <Animated.View
            style={[
              styles.timerBanner,
              { backgroundColor: isUrgent ? '#FEE2E2' : '#F0FDF4', borderColor: isUrgent ? colors.danger : colors.success },
              isUrgent && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.timerLeft}>
              <Text style={styles.timerIcon}>{isUrgent ? '⚠️' : '⏱️'}</Text>
              <View>
                <Text style={[styles.timerLabel, { color: timerColor }]}>
                  {isUrgent ? 'Almost out of time!' : 'Window closes in'}
                </Text>
                <Text style={[styles.timerValue, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: timerColor }]} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm{'\n'}Meetup</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {confirmed && (
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedIcon}>🎉</Text>
            <Text style={styles.confirmedText}>Meetup Confirmed! Have fun!</Text>
          </View>
        )}

        {locked && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedText}>Time's up — this chat has locked.</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => {
            if (msg.from === 'system') {
              return (
                <View key={msg.id} style={styles.systemMsg}>
                  <Text style={styles.systemMsgText}>{msg.text}</Text>
                </View>
              );
            }
            const isMe = msg.from === 'me';
            return (
              <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <View style={[styles.msgAvatar, { backgroundColor: chat.avatarColor }]}>
                    <Text style={styles.msgAvatarText}>{chat.initials}</Text>
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, locked && styles.inputRowLocked]}>
          {locked ? (
            <View style={styles.lockedInput}>
              <Text style={styles.lockedInputText}>🔒 This conversation has ended</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.chatInput}
                placeholder={confirmed ? 'Chat continues after meetup...' : 'Say something...'}
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Chat List ───────────────────────────────────────────────────────────────

function ChatRow({ chat, onPress }) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt))
  );

  useEffect(() => {
    if (chat.confirmed || chat.locked) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt)));
    }, 1000);
    return () => clearInterval(interval);
  }, [chat.confirmed, chat.locked]);

  const activity = ACTIVITY_META[chat.activity];
  const lastMsg = chat.messages[chat.messages.length - 1];
  const timerColor = getTimerColor(timeLeft);
  const isUrgent = timeLeft < 30 * 60 * 1000 && !chat.confirmed && !chat.locked;

  return (
    <TouchableOpacity
      style={[styles.chatRow, isUrgent && styles.chatRowUrgent]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.listAvatar, { backgroundColor: chat.avatarColor }]}>
        <Text style={styles.listAvatarText}>{chat.initials}</Text>
        {!chat.confirmed && !chat.locked && <View style={[styles.listAvatarDot, { backgroundColor: timerColor }]} />}
      </View>
      <View style={styles.chatRowInfo}>
        <View style={styles.chatRowTop}>
          <Text style={styles.chatRowName}>{chat.name}, {chat.age}</Text>
          {chat.confirmed ? (
            <View style={styles.confirmedTag}>
              <Text style={styles.confirmedTagText}>✓ Confirmed</Text>
            </View>
          ) : chat.locked ? (
            <View style={styles.lockedTag}>
              <Text style={styles.lockedTagText}>🔒 Locked</Text>
            </View>
          ) : (
            <Text style={[styles.chatRowTimer, { color: timerColor }]}>⏱ {formatTime(timeLeft)}</Text>
          )}
        </View>
        <Text style={styles.chatRowActivity}>{activity.emoji} {activity.label} · {chat.neighborhood}</Text>
        {lastMsg && (
          <Text style={styles.chatRowPreview} numberOfLines={1}>
            {lastMsg.from === 'me' ? 'You: ' : ''}{lastMsg.text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ActiveChatsScreen() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(null);

  const handleUpdateChat = useCallback((chatId, updates) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, ...updates } : c));
  }, []);

  if (activeChat) {
    const chatData = chats.find(c => c.id === activeChat);
    return (
      <ChatDetail
        chat={chatData}
        onBack={() => setActiveChat(null)}
        onUpdateChat={handleUpdateChat}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Chats</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{chats.length}</Text>
        </View>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No active chats yet</Text>
          <Text style={styles.emptyText}>Send an invite from Discover to start a conversation.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View style={styles.infoBar}>
              <Text style={styles.infoBarText}>
                ⏱ Chats lock after 3 hours — confirm your meetup!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatRow chat={item} onPress={() => setActiveChat(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.h1, color: colors.text },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...typography.caption, color: colors.white, fontWeight: '700' },

  infoBar: {
    backgroundColor: '#FFF7ED',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoBarText: { ...typography.bodySmall, color: '#C2410C', textAlign: 'center' },

  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  separator: { height: 1, backgroundColor: colors.border },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  chatRowUrgent: { backgroundColor: '#FFF5F7' },

  listAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  listAvatarText: { fontSize: 22, fontWeight: '700', color: colors.text },
  listAvatarDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  chatRowInfo: { flex: 1 },
  chatRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  chatRowName: { ...typography.h4, color: colors.text },
  chatRowTimer: { ...typography.caption, fontWeight: '700' },
  chatRowActivity: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 3 },
  chatRowPreview: { ...typography.bodySmall, color: colors.textMuted },

  confirmedTag: { backgroundColor: '#D1FAE5', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  confirmedTagText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  lockedTag: { backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  lockedTagText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // ─── Chat Detail Styles ─────────────────────────────────────────────────
  chatContainer: { flex: 1, backgroundColor: colors.background },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: spacing.sm, padding: spacing.xs },
  backArrow: { fontSize: 24, color: colors.primary },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  chatAvatarText: { fontSize: 18, fontWeight: '700', color: colors.text },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { ...typography.h4, color: colors.text },
  chatHeaderSub: { flexDirection: 'row', alignItems: 'center' },
  chatHeaderActivity: { ...typography.bodySmall, color: colors.textSecondary },
  chatHeaderDot: { ...typography.bodySmall, color: colors.textMuted },
  chatHeaderNeighborhood: { ...typography.bodySmall, color: colors.textSecondary },

  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  timerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timerIcon: { fontSize: 22 },
  timerLabel: { ...typography.caption, fontWeight: '600', marginBottom: 2 },
  timerValue: { ...typography.h2, fontWeight: '800', letterSpacing: 1 },

  confirmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmBtnText: { ...typography.button, color: colors.white, textAlign: 'center', lineHeight: 18 },

  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#D1FAE5',
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  confirmedIcon: { fontSize: 20 },
  confirmedText: { ...typography.h4, color: colors.success },

  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  lockedIcon: { fontSize: 18 },
  lockedText: { ...typography.h4, color: colors.textSecondary },

  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },

  systemMsg: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
  },
  systemMsgText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: colors.text },
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleThem: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { ...typography.body, color: colors.text, lineHeight: 22 },
  bubbleTextMe: { color: colors.white },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  inputRowLocked: { backgroundColor: colors.surfaceAlt },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnText: { fontSize: 20, color: colors.white, fontWeight: '700' },
  lockedInput: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  lockedInputText: { ...typography.body, color: colors.textMuted },
});
