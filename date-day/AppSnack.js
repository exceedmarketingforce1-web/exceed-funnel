import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  PanResponder,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ─── Theme ───────────────────────────────────────────────────────────────────

const C = {
  primary: '#FF4B6E',
  primaryLight: '#FF7A95',
  background: '#F8F5F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EDE9',
  text: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9999AA',
  border: '#E5E2DF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

const T = {
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '800' },
  h3: { fontSize: 20, fontWeight: '600' },
  h4: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15 },
  small: { fontSize: 13 },
  caption: { fontSize: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  button: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const ACTIVITIES = [
  { id: 'coffee',      emoji: '☕', label: 'Coffee',       color: '#92400E', bg: '#FEF3C7' },
  { id: 'happyHour',  emoji: '🍸', label: 'Happy Hour',   color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'casualBites',emoji: '🌮', label: 'Casual Bites', color: '#D97706', bg: '#FEF9C3' },
];

const NEIGHBORHOODS = [
  'Downtown', 'Midtown', 'Uptown', 'East Side', 'West Side',
  'The Heights', 'Montrose', 'SoHo', 'Brooklyn', 'Silver Lake',
];

const MOCK_USERS = [
  { id:'1', name:'Sophia',  age:28, neighborhood:'Midtown',     activity:'coffee',      initials:'S', avatarColor:'#FFB3C6', bio:"Grad student who loves good espresso and great conversation.", minutesAgo:5  },
  { id:'2', name:'Marcus',  age:31, neighborhood:'Downtown',    activity:'happyHour',   initials:'M', avatarColor:'#C4B5FD', bio:"Creative director. Cocktails after a long week are non-negotiable.", minutesAgo:12 },
  { id:'3', name:'Priya',   age:26, neighborhood:'East Side',   activity:'casualBites', initials:'P', avatarColor:'#86EFAC', bio:"Foodie & photographer. Always down to try a new spot.", minutesAgo:3  },
  { id:'4', name:'Jordan',  age:30, neighborhood:'The Heights', activity:'coffee',      initials:'J', avatarColor:'#FCA5A5', bio:"UX designer. Coffee is basically a personality trait.", minutesAgo:20 },
  { id:'5', name:'Alex',    age:27, neighborhood:'West Side',   activity:'happyHour',   initials:'A', avatarColor:'#7DD3FC', bio:"Music producer. Happy hours are my thing.", minutesAgo:8  },
  { id:'6', name:'Camille', age:29, neighborhood:'Uptown',      activity:'casualBites', initials:'C', avatarColor:'#FDE68A', bio:"Architect who can debate tacos vs. burritos all day.", minutesAgo:35 },
];

const INITIAL_CHATS = [
  {
    id: '1', name: 'Sophia', age: 28, neighborhood: 'Midtown', activity: 'coffee',
    initials: 'S', avatarColor: '#FFB3C6',
    startedAt: Date.now() - 25 * 60 * 1000,
    confirmed: false, locked: false,
    messages: [
      { id:'m1', from:'them', text:"Hey! Saw you were free for coffee too 👋" },
      { id:'m2', from:'me',   text:"Hey Sophia! Yes, I'm in Midtown right now actually." },
      { id:'m3', from:'them', text:"Perfect! There's a great spot on 5th. Free in 30 mins?" },
    ],
  },
  {
    id: '2', name: 'Marcus', age: 31, neighborhood: 'Downtown', activity: 'happyHour',
    initials: 'M', avatarColor: '#C4B5FD',
    startedAt: Date.now() - 90 * 60 * 1000,
    confirmed: false, locked: false,
    messages: [
      { id:'m1', from:'them', text:"Happy hour sounds like exactly what I need tonight." },
      { id:'m2', from:'me',   text:"Same! Any preference on spots downtown?" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ms) {
  if (ms <= 0) return '0:00:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function timerColor(ms) {
  if (ms <= 30 * 60 * 1000) return C.danger;
  if (ms <= 60 * 60 * 1000) return C.warning;
  return C.success;
}

function activityMeta(id) {
  return ACTIVITIES.find(a => a.id === id) || ACTIVITIES[0];
}

// ─── Tab 1: Today's Status ────────────────────────────────────────────────────

function TodayStatusScreen() {
  const [isFree, setIsFree]               = useState(false);
  const [selectedActivity, setActivity]   = useState(null);
  const [neighborhood, setNeighborhood]   = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = NEIGHBORHOODS.filter(n =>
    neighborhood.length > 0 && n.toLowerCase().includes(neighborhood.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={s.statusContent} keyboardShouldPersistTaps="handled">

        <View style={{ marginBottom: 24 }}>
          <Text style={[T.label, { color: C.primary, marginBottom: 4 }]}>Hey there 👋</Text>
          <Text style={[T.h1, { color: C.text, marginBottom: 8 }]}>Today's Status</Text>
          <Text style={[T.body, { color: C.textSecondary, lineHeight: 22 }]}>
            Set your availability and find someone to meet up with — today.
          </Text>
        </View>

        {/* Toggle Card */}
        <View style={[s.card, isFree && { borderColor: '#FF7A95', backgroundColor: '#FFF5F7' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={[T.h4, { color: C.text, marginBottom: 2 }]}>I'm Free Today</Text>
              <Text style={[T.small, { color: C.textSecondary }]}>
                {isFree ? "You're visible to others nearby" : 'Toggle on to start matching'}
              </Text>
            </View>
            <Switch
              value={isFree}
              onValueChange={v => { setIsFree(v); if (!v) setActivity(null); }}
              trackColor={{ false: C.border, true: '#FF7A95' }}
              thumbColor={isFree ? C.primary : C.white}
              ios_backgroundColor={C.border}
            />
          </View>
          {isFree && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FFD6DE' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.success, marginRight: 8 }} />
              <Text style={[T.caption, { color: C.success, fontWeight: '600' }]}>Active until midnight</Text>
            </View>
          )}
        </View>

        {/* Activity Cards */}
        {isFree && (
          <>
            <Text style={[T.h4, { color: C.text, marginBottom: 4, marginTop: 8 }]}>What sounds good?</Text>
            <Text style={[T.small, { color: C.textSecondary, marginBottom: 12 }]}>Pick the vibe for today</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {ACTIVITIES.map(a => {
                const sel = selectedActivity === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[s.activityCard, { backgroundColor: a.bg, borderColor: sel ? a.color : 'transparent', borderWidth: 2 }]}
                    onPress={() => setActivity(a.id)}
                    activeOpacity={0.8}
                  >
                    {sel && (
                      <View style={[s.check, { backgroundColor: a.color }]}>
                        <Text style={{ color: C.white, fontSize: 11, fontWeight: '700' }}>✓</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</Text>
                    <Text style={[T.label, { color: sel ? a.color : C.text, textAlign: 'center' }]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Neighborhood */}
            <Text style={[T.h4, { color: C.text, marginBottom: 4 }]}>Your Neighborhood</Text>
            <Text style={[T.small, { color: C.textSecondary, marginBottom: 10 }]}>Where are you hanging around?</Text>
            <View style={s.inputRow}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
              <TextInput
                style={[T.body, { flex: 1, color: C.text, paddingVertical: 14 }]}
                placeholder="e.g. Midtown, Downtown..."
                placeholderTextColor={C.textMuted}
                value={neighborhood}
                onChangeText={t => { setNeighborhood(t); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={s.suggestions}>
                {suggestions.map(n => (
                  <TouchableOpacity key={n} style={s.suggestionItem} onPress={() => { setNeighborhood(n); setShowSuggestions(false); }}>
                    <Text style={[T.body, { color: C.text }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Summary */}
            {selectedActivity && neighborhood.length > 0 && (
              <View style={{ backgroundColor: C.primary, borderRadius: 16, padding: 16, marginTop: 12 }}>
                <Text style={[T.caption, { color: 'rgba(255,255,255,0.7)', marginBottom: 4 }]}>Your Status</Text>
                <Text style={[T.h4, { color: C.white, marginBottom: 6 }]}>
                  {activityMeta(selectedActivity).emoji} {activityMeta(selectedActivity).label} · {neighborhood}
                </Text>
                <Text style={[T.small, { color: 'rgba(255,255,255,0.8)' }]}>
                  You're now visible to people nearby. Check Discover!
                </Text>
              </View>
            )}
          </>
        )}

        {!isFree && (
          <View style={[s.card, { alignItems: 'center', padding: 32, marginTop: 16 }]}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💤</Text>
            <Text style={[T.h3, { color: C.text, marginBottom: 8, textAlign: 'center' }]}>You're invisible right now</Text>
            <Text style={[T.body, { color: C.textSecondary, textAlign: 'center', lineHeight: 22 }]}>
              Toggle "I'm Free Today" to appear in others' Discover feed and start getting invited out.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tab 2: Discover (Swipe Cards) ───────────────────────────────────────────

function SwipeCardInner({ user }) {
  const a = activityMeta(user.activity);
  return (
    <>
      {/* Photo area */}
      <View style={[dc.photoArea, { backgroundColor: user.avatarColor }]}>
        <Text style={dc.photoInitials}>{user.initials}</Text>
        <View style={[dc.activityTag, { backgroundColor: a.bg }]}>
          <Text style={dc.activityTagEmoji}>{a.emoji}</Text>
          <Text style={[dc.activityTagLabel, { color: a.color }]}>{a.label}</Text>
        </View>
        <View style={dc.onlinePill}>
          <View style={dc.onlineDotSmall} />
          <Text style={dc.onlinePillText}>Free Today</Text>
        </View>
      </View>
      {/* Info area */}
      <View style={dc.infoArea}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={dc.infoName}>{user.name}, {user.age}</Text>
          <Text style={dc.infoTime}>{user.minutesAgo}m ago</Text>
        </View>
        <Text style={dc.infoLocation}>📍 {user.neighborhood}</Text>
        <Text style={dc.infoBio} numberOfLines={2}>{user.bio}</Text>
      </View>
    </>
  );
}

function DiscoverScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [invitedIds, setInvitedIds]     = useState([]);
  const [lastSwipe, setLastSwipe]       = useState(null); // 'right' | 'left' | null

  const position      = useRef(new Animated.ValueXY()).current;
  const currentIdxRef = useRef(0);

  // Keep ref in sync so panResponder closure always has latest index
  useEffect(() => { currentIdxRef.current = currentIndex; }, [currentIndex]);

  // Derived animated values
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });
  const inviteOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  // Second card scales up as top card moves away
  const secondCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.93, 1],
    extrapolate: 'clamp',
  });

  // Stable ref to avoid stale closure in panResponder
  const actionRef = useRef(null);
  actionRef.current = (direction) => {
    const user = MOCK_USERS[currentIdxRef.current];
    if (!user) return;
    Animated.timing(position, {
      toValue: { x: direction * SCREEN_WIDTH * 1.5, y: direction * 60 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      if (direction > 0) {
        setInvitedIds(p => [...p, user.id]);
        setLastSwipe('right');
        Alert.alert(
          'Invite Sent! 🎉',
          `You invited ${user.name} for ${activityMeta(user.activity).label}. Check Active Chats once they accept!`,
          [
            { text: 'Open Chats', onPress: () => navigation.navigate('Chats') },
            { text: 'Keep Swiping', style: 'cancel' },
          ]
        );
      } else {
        setLastSwipe('left');
      }
      setCurrentIndex(p => p + 1);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy * 0.25 });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD)       actionRef.current(1);
        else if (g.dx < -SWIPE_THRESHOLD) actionRef.current(-1);
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
      },
    })
  ).current;

  const remaining   = MOCK_USERS.length - currentIndex;
  const topUser     = MOCK_USERS[currentIndex];
  const secondUser  = MOCK_USERS[currentIndex + 1];
  const thirdUser   = MOCK_USERS[currentIndex + 2];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[T.h1, { color: C.text }]}>Discover</Text>
          {remaining > 0 && (
            <Text style={[T.small, { color: C.textSecondary }]}>
              {remaining} {remaining === 1 ? 'person' : 'people'} free nearby
            </Text>
          )}
        </View>
        {remaining > 0 && (
          <View style={dc.progressPills}>
            {MOCK_USERS.map((_, i) => (
              <View
                key={i}
                style={[
                  dc.progressDot,
                  i < currentIndex
                    ? { backgroundColor: C.border }
                    : i === currentIndex
                    ? { backgroundColor: C.primary, width: 20 }
                    : { backgroundColor: C.border },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Card Stack */}
      <View style={dc.stackContainer}>
        {!topUser ? (
          // Empty state
          <View style={dc.emptyCard}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🎉</Text>
            <Text style={[T.h3, { color: C.text, marginBottom: 8, textAlign: 'center' }]}>
              You've seen everyone!
            </Text>
            <Text style={[T.body, { color: C.textSecondary, textAlign: 'center', lineHeight: 22 }]}>
              Check back later — more people go free throughout the day.
            </Text>
            <TouchableOpacity
              style={[s.inviteBtn, { marginTop: 24 }]}
              onPress={() => { setCurrentIndex(0); setInvitedIds([]); position.setValue({ x: 0, y: 0 }); }}
            >
              <Text style={[T.button, { color: C.white }]}>Start Over</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Third card (back) */}
            {thirdUser && (
              <View style={[dc.card, dc.cardBack]}>
                <SwipeCardInner user={thirdUser} />
              </View>
            )}
            {/* Second card (mid) */}
            {secondUser && (
              <Animated.View style={[dc.card, dc.cardMid, { transform: [{ scale: secondCardScale }] }]}>
                <SwipeCardInner user={secondUser} />
              </Animated.View>
            )}
            {/* Top card (front, draggable) */}
            <Animated.View
              style={[
                dc.card,
                dc.cardFront,
                { transform: [...position.getTranslateTransform(), { rotate }] },
              ]}
              {...panResponder.panHandlers}
            >
              {/* INVITE badge */}
              <Animated.View style={[dc.swipeBadge, dc.inviteBadge, { opacity: inviteOpacity }]}>
                <Text style={dc.inviteBadgeText}>INVITE</Text>
                <Text style={{ fontSize: 20 }}>✓</Text>
              </Animated.View>
              {/* SKIP badge */}
              <Animated.View style={[dc.swipeBadge, dc.skipBadge, { opacity: skipOpacity }]}>
                <Text style={{ fontSize: 20 }}>✗</Text>
                <Text style={dc.skipBadgeText}>SKIP</Text>
              </Animated.View>

              <SwipeCardInner user={topUser} />
            </Animated.View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      {topUser && (
        <View style={dc.actionRow}>
          <TouchableOpacity
            style={dc.skipActionBtn}
            onPress={() => actionRef.current(-1)}
            activeOpacity={0.8}
          >
            <Text style={dc.skipActionIcon}>✕</Text>
            <Text style={dc.skipActionLabel}>Skip</Text>
          </TouchableOpacity>

          <View style={dc.centerHint}>
            <Text style={[T.caption, { color: C.textMuted, textAlign: 'center' }]}>
              swipe or tap
            </Text>
          </View>

          <TouchableOpacity
            style={dc.inviteActionBtn}
            onPress={() => actionRef.current(1)}
            activeOpacity={0.8}
          >
            <Text style={dc.inviteActionIcon}>♥</Text>
            <Text style={dc.inviteActionLabel}>Invite</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Tab 3: Active Chats ──────────────────────────────────────────────────────

function ChatDetail({ chat, onBack, onUpdate }) {
  const [messages, setMessages] = useState(chat.messages);
  const [inputText, setInputText]   = useState('');
  const [confirmed, setConfirmed]   = useState(chat.confirmed);
  const [locked, setLocked]         = useState(chat.locked);
  const [timeLeft, setTimeLeft]     = useState(
    Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt))
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (confirmed || locked) return;
    const id = setInterval(() => {
      const rem = Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt));
      setTimeLeft(rem);
      if (rem === 0) { setLocked(true); onUpdate(chat.id, { locked: true }); }
    }, 1000);
    return () => clearInterval(id);
  }, [confirmed, locked]);

  useEffect(() => {
    if (!confirmed && !locked && timeLeft < 30 * 60 * 1000) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [timeLeft < 30 * 60 * 1000]);

  const send = () => {
    if (!inputText.trim() || locked) return;
    const msg = { id: `m${Date.now()}`, from: 'me', text: inputText.trim() };
    const updated = [...messages, msg];
    setMessages(updated);
    onUpdate(chat.id, { messages: updated });
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const confirmMeetup = () => {
    Alert.alert('Confirm Meetup? 🎉', `Lock in your ${activityMeta(chat.activity).label} with ${chat.name}!`, [
      {
        text: "Yes, Let's Go!",
        onPress: () => {
          const sys = { id:`m${Date.now()}`, from:'system', text:`Meetup confirmed! Enjoy your ${activityMeta(chat.activity).emoji} ${activityMeta(chat.activity).label}.` };
          const updated = [...messages, sys];
          setMessages(updated);
          setConfirmed(true);
          onUpdate(chat.id, { confirmed: true, messages: updated });
        },
      },
      { text: 'Not Yet', style: 'cancel' },
    ]);
  };

  const tc = timerColor(timeLeft);
  const urgent = timeLeft < 30 * 60 * 1000 && !confirmed && !locked;
  const a = activityMeta(chat.activity);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={[s.safeArea, { backgroundColor: C.background }]} edges={['top']}>

        {/* Header */}
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={onBack} style={{ marginRight: 8, padding: 4 }}>
            <Text style={{ fontSize: 24, color: C.primary }}>←</Text>
          </TouchableOpacity>
          <View style={[s.avatar, { width: 44, height: 44, borderRadius: 22, backgroundColor: chat.avatarColor, marginRight: 10 }]}>
            <Text style={[s.avatarText, { fontSize: 18 }]}>{chat.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[T.h4, { color: C.text }]}>{chat.name}, {chat.age}</Text>
            <Text style={[T.small, { color: C.textSecondary }]}>{a.emoji} {a.label} · {chat.neighborhood}</Text>
          </View>
        </View>

        {/* Timer Banner */}
        {!confirmed && !locked && (
          <Animated.View style={[
            s.timerBanner,
            { backgroundColor: urgent ? '#FEE2E2' : '#F0FDF4', borderColor: urgent ? C.danger : C.success },
            urgent && { transform: [{ scale: pulseAnim }] },
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{urgent ? '⚠️' : '⏱️'}</Text>
              <View>
                <Text style={[T.caption, { color: tc, fontWeight: '600', marginBottom: 2 }]}>
                  {urgent ? 'Almost out of time!' : 'Window closes in'}
                </Text>
                <Text style={[T.h2, { color: tc, letterSpacing: 1 }]}>{formatTime(timeLeft)}</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.confirmBtn, { backgroundColor: tc }]} onPress={confirmMeetup}>
              <Text style={[T.button, { color: C.white, textAlign: 'center', lineHeight: 18 }]}>{'Confirm\nMeetup'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {confirmed && (
          <View style={[s.statusBanner, { backgroundColor: '#D1FAE5' }]}>
            <Text style={{ fontSize: 18 }}>🎉</Text>
            <Text style={[T.h4, { color: C.success }]}>Meetup Confirmed! Have fun!</Text>
          </View>
        )}
        {locked && (
          <View style={[s.statusBanner, { backgroundColor: C.surfaceAlt }]}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={[T.h4, { color: C.textSecondary }]}>Time's up — this chat has locked.</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map(msg => {
            if (msg.from === 'system') {
              return (
                <View key={msg.id} style={{ alignSelf: 'center', backgroundColor: C.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginVertical: 8 }}>
                  <Text style={[T.caption, { color: C.textSecondary }]}>{msg.text}</Text>
                </View>
              );
            }
            const me = msg.from === 'me';
            return (
              <View key={msg.id} style={[{ flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3 }, me && { justifyContent: 'flex-end' }]}>
                {!me && (
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: chat.avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{chat.initials}</Text>
                  </View>
                )}
                <View style={[s.bubble, me ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[T.body, { color: me ? C.white : C.text, lineHeight: 22 }]}>{msg.text}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[s.inputBar, locked && { backgroundColor: C.surfaceAlt }]}>
          {locked ? (
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={[T.body, { color: C.textMuted }]}>🔒 This conversation has ended</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={s.chatInput}
                placeholder="Say something..."
                placeholderTextColor={C.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, !inputText.trim() && { backgroundColor: C.border }]}
                onPress={send}
                disabled={!inputText.trim()}
              >
                <Text style={{ fontSize: 20, color: C.white, fontWeight: '700' }}>↑</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ActiveChatsScreen() {
  const [chats, setChats]       = useState(INITIAL_CHATS);
  const [activeId, setActiveId] = useState(null);

  const handleUpdate = useCallback((id, updates) => {
    setChats(p => p.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  if (activeId) {
    return (
      <ChatDetail
        chat={chats.find(c => c.id === activeId)}
        onBack={() => setActiveId(null)}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={[s.header, { marginBottom: 4 }]}>
        <Text style={[T.h1, { color: C.text }]}>Active Chats</Text>
        <View style={[s.pill, { backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 4 }]}>
          <Text style={[T.caption, { color: C.white, fontWeight: '700' }]}>{chats.length}</Text>
        </View>
      </View>
      <FlatList
        data={chats}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
        ListHeaderComponent={
          <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#FED7AA' }}>
            <Text style={[T.small, { color: '#C2410C', textAlign: 'center' }]}>⏱ Chats lock after 3 hours — confirm your meetup!</Text>
          </View>
        }
        renderItem={({ item }) => <ChatListRow chat={item} onPress={() => setActiveId(item.id)} />}
      />
    </SafeAreaView>
  );
}

function ChatListRow({ chat, onPress }) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt))
  );

  useEffect(() => {
    if (chat.confirmed || chat.locked) return;
    const id = setInterval(() => setTimeLeft(Math.max(0, THREE_HOURS_MS - (Date.now() - chat.startedAt))), 1000);
    return () => clearInterval(id);
  }, [chat.confirmed, chat.locked]);

  const a = activityMeta(chat.activity);
  const tc = timerColor(timeLeft);
  const urgent = timeLeft < 30 * 60 * 1000 && !chat.confirmed && !chat.locked;
  const lastMsg = chat.messages[chat.messages.length - 1];

  return (
    <TouchableOpacity
      style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: urgent ? '#FFF5F7' : C.surface, paddingHorizontal: 8, borderRadius: 12 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ position: 'relative', marginRight: 14 }}>
        <View style={[s.avatar, { backgroundColor: chat.avatarColor }]}>
          <Text style={s.avatarText}>{chat.initials}</Text>
        </View>
        {!chat.confirmed && !chat.locked && (
          <View style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: tc, borderWidth: 2, borderColor: C.surface }} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={[T.h4, { color: C.text }]}>{chat.name}, {chat.age}</Text>
          {chat.confirmed
            ? <View style={[s.pill, { backgroundColor: '#D1FAE5' }]}><Text style={[T.caption, { color: C.success, fontWeight: '700' }]}>✓ Confirmed</Text></View>
            : chat.locked
            ? <View style={[s.pill, { backgroundColor: C.surfaceAlt }]}><Text style={[T.caption, { color: C.textSecondary }]}>🔒 Locked</Text></View>
            : <Text style={[T.caption, { color: tc, fontWeight: '700' }]}>⏱ {formatTime(timeLeft)}</Text>
          }
        </View>
        <Text style={[T.small, { color: C.textSecondary, marginBottom: 3 }]}>{a.emoji} {a.label} · {chat.neighborhood}</Text>
        {lastMsg && <Text style={[T.small, { color: C.textMuted }]} numberOfLines={1}>{lastMsg.from === 'me' ? 'You: ' : ''}{lastMsg.text}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const TAB_META = {
  Status:   { active: '🌟', inactive: '☀️', label: "Today's Status" },
  Discover: { active: '💘', inactive: '🔍', label: 'Discover'       },
  Chats:    { active: '💬', inactive: '💭', label: 'Chats'          },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: C.surface,
              borderTopWidth: 1,
              borderTopColor: C.border,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
            },
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22 }}>{focused ? TAB_META[route.name].active : TAB_META[route.name].inactive}</Text>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={[T.caption, { color: focused ? C.primary : C.textMuted, fontWeight: focused ? '700' : '400', marginTop: 2 }]}>
                {TAB_META[route.name].label}
              </Text>
            ),
          })}
        >
          <Tab.Screen name="Status"   component={TodayStatusScreen} />
          <Tab.Screen name="Discover" component={DiscoverScreen}    />
          <Tab.Screen name="Chats"    component={ActiveChatsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: C.background },
  statusContent:{ paddingHorizontal: 16, paddingBottom: 48 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },

  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: C.border,
    shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  activityCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', position: 'relative' },
  check:        { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, marginBottom: 6 },
  suggestions:  { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden', shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  suggestionItem:{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },

  avatar:       { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText:   { fontSize: 22, fontWeight: '700', color: C.text },
  activityBubble:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pill:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  chipActive:   { backgroundColor: C.primary, borderColor: C.primary },
  inviteBtn:    { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },

  chatHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  timerBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 14, borderRadius: 16, padding: 14, borderWidth: 1.5 },
  confirmBtn:   { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 14, borderRadius: 16, padding: 14 },

  bubble:       { maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleThem:   { backgroundColor: C.surface, borderBottomLeftRadius: 4 },
  bubbleMe:     { backgroundColor: C.primary, borderBottomRightRadius: 4 },

  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  chatInput:    { flex: 1, backgroundColor: C.background, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.text, maxHeight: 100, borderWidth: 1, borderColor: C.border },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});

// ─── Discover Card Styles ─────────────────────────────────────────────────────

const dc = StyleSheet.create({
  // Card stack container
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Base card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.surface,
    position: 'absolute',
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardFront: { zIndex: 30 },
  cardMid:   { zIndex: 20, top: 10 },
  cardBack:  { zIndex: 10, top: 20, transform: [{ scale: 0.88 }], opacity: 0.6 },

  // Photo section (top ~62% of card)
  photoArea: {
    height: CARD_HEIGHT * 0.62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoInitials: {
    fontSize: 80,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.25)',
  },
  activityTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activityTagEmoji: { fontSize: 16 },
  activityTagLabel: { fontSize: 13, fontWeight: '700' },
  onlinePill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlinePillText: { fontSize: 12, color: C.white, fontWeight: '600' },

  // Info section (bottom ~38%)
  infoArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.surface,
  },
  infoName: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
  infoLocation: { fontSize: 14, color: C.textSecondary, marginBottom: 8 },
  infoTime: { fontSize: 12, color: C.textMuted },
  infoBio: { fontSize: 14, color: C.textSecondary, lineHeight: 20 },

  // Swipe feedback badges
  swipeBadge: {
    position: 'absolute',
    top: 40,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 3,
  },
  inviteBadge: {
    left: 20,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: C.success,
    transform: [{ rotate: '-15deg' }],
  },
  inviteBadgeText: { fontSize: 18, fontWeight: '800', color: C.success },
  skipBadge: {
    right: 20,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: C.danger,
    transform: [{ rotate: '15deg' }],
  },
  skipBadgeText: { fontSize: 18, fontWeight: '800', color: C.danger },

  // Bottom action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    gap: 20,
  },
  skipActionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.danger,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  skipActionIcon:  { fontSize: 22, color: C.danger },
  skipActionLabel: { fontSize: 10, color: C.danger, fontWeight: '600', marginTop: 2 },
  centerHint: { flex: 1, alignItems: 'center' },
  inviteActionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  inviteActionIcon:  { fontSize: 26, color: C.white },
  inviteActionLabel: { fontSize: 10, color: C.white, fontWeight: '600', marginTop: 2 },

  // Progress dots
  progressPills: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  progressDot: { width: 8, height: 8, borderRadius: 4 },

  // Empty state
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 1,
    borderColor: C.border,
  },
});
