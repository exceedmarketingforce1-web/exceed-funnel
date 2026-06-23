import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH    = SCREEN_WIDTH - 40;
const CARD_HEIGHT   = SCREEN_HEIGHT * 0.60;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

const ACTIVITY_META = {
  coffee:      { emoji: '☕', label: 'Coffee',       color: '#92400E', bg: '#FEF3C7' },
  happyHour:   { emoji: '🍸', label: 'Happy Hour',   color: '#7C3AED', bg: '#EDE9FE' },
  casualBites: { emoji: '🌮', label: 'Casual Bites', color: '#D97706', bg: '#FEF9C3' },
};

const MOCK_USERS = [
  { id:'1', name:'Sophia',  age:28, neighborhood:'Midtown',     activity:'coffee',      initials:'S', avatarColor:'#FFB3C6', bio:"Grad student who loves good espresso and great conversation.", minutesAgo:5  },
  { id:'2', name:'Marcus',  age:31, neighborhood:'Downtown',    activity:'happyHour',   initials:'M', avatarColor:'#C4B5FD', bio:"Creative director. Cocktails after a long week are non-negotiable.", minutesAgo:12 },
  { id:'3', name:'Priya',   age:26, neighborhood:'East Side',   activity:'casualBites', initials:'P', avatarColor:'#86EFAC', bio:"Foodie & photographer. Always down to try a new spot.", minutesAgo:3  },
  { id:'4', name:'Jordan',  age:30, neighborhood:'The Heights', activity:'coffee',      initials:'J', avatarColor:'#FCA5A5', bio:"UX designer. Coffee is basically a personality trait.", minutesAgo:20 },
  { id:'5', name:'Alex',    age:27, neighborhood:'West Side',   activity:'happyHour',   initials:'A', avatarColor:'#7DD3FC', bio:"Music producer. Happy hours are my thing.", minutesAgo:8  },
  { id:'6', name:'Camille', age:29, neighborhood:'Uptown',      activity:'casualBites', initials:'C', avatarColor:'#FDE68A', bio:"Architect who can debate tacos vs. burritos all day.", minutesAgo:35 },
];

function activityMeta(id) {
  return ACTIVITY_META[id] || ACTIVITY_META.coffee;
}

function SwipeCardInner({ user }) {
  const a = activityMeta(user.activity);
  return (
    <>
      <View style={[styles.photoArea, { backgroundColor: user.avatarColor }]}>
        <Text style={styles.photoInitials}>{user.initials}</Text>
        <View style={[styles.activityTag, { backgroundColor: a.bg }]}>
          <Text style={styles.activityTagEmoji}>{a.emoji}</Text>
          <Text style={[styles.activityTagLabel, { color: a.color }]}>{a.label}</Text>
        </View>
        <View style={styles.onlinePill}>
          <View style={styles.onlineDotSmall} />
          <Text style={styles.onlinePillText}>Free Today</Text>
        </View>
      </View>
      <View style={styles.infoArea}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.infoName}>{user.name}, {user.age}</Text>
          <Text style={styles.infoTime}>{user.minutesAgo}m ago</Text>
        </View>
        <Text style={styles.infoLocation}>📍 {user.neighborhood}</Text>
        <Text style={styles.infoBio} numberOfLines={2}>{user.bio}</Text>
      </View>
    </>
  );
}

export default function DiscoverScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [invitedIds, setInvitedIds]     = useState([]);

  const position      = useRef(new Animated.ValueXY()).current;
  const currentIdxRef = useRef(0);

  useEffect(() => { currentIdxRef.current = currentIndex; }, [currentIndex]);

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
  const secondCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.93, 1],
    extrapolate: 'clamp',
  });

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
        Alert.alert(
          'Invite Sent! 🎉',
          `You invited ${user.name} for ${activityMeta(user.activity).label}. Check Active Chats once they accept!`,
          [
            { text: 'Open Chats', onPress: () => navigation.navigate('ActiveChats') },
            { text: 'Keep Swiping', style: 'cancel' },
          ]
        );
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

  const topUser    = MOCK_USERS[currentIndex];
  const secondUser = MOCK_USERS[currentIndex + 1];
  const thirdUser  = MOCK_USERS[currentIndex + 2];
  const remaining  = MOCK_USERS.length - currentIndex;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[typography.h1, { color: colors.text }]}>Discover</Text>
          {remaining > 0 && (
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {remaining} {remaining === 1 ? 'person' : 'people'} free nearby
            </Text>
          )}
        </View>
        {remaining > 0 && (
          <View style={styles.progressPills}>
            {MOCK_USERS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentIndex
                    ? { backgroundColor: colors.border }
                    : i === currentIndex
                    ? { backgroundColor: colors.primary, width: 20 }
                    : { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Card Stack */}
      <View style={styles.stackContainer}>
        {!topUser ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🎉</Text>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 8, textAlign: 'center' }]}>
              You've seen everyone!
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }]}>
              Check back later — more people go free throughout the day.
            </Text>
            <TouchableOpacity
              style={styles.restartBtn}
              onPress={() => { setCurrentIndex(0); setInvitedIds([]); position.setValue({ x: 0, y: 0 }); }}
            >
              <Text style={[typography.button, { color: colors.white }]}>Start Over</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {thirdUser && (
              <View style={[styles.card, styles.cardBack]}>
                <SwipeCardInner user={thirdUser} />
              </View>
            )}
            {secondUser && (
              <Animated.View style={[styles.card, styles.cardMid, { transform: [{ scale: secondCardScale }] }]}>
                <SwipeCardInner user={secondUser} />
              </Animated.View>
            )}
            <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                { transform: [...position.getTranslateTransform(), { rotate }] },
              ]}
              {...panResponder.panHandlers}
            >
              <Animated.View style={[styles.swipeBadge, styles.inviteBadge, { opacity: inviteOpacity }]}>
                <Text style={styles.inviteBadgeText}>INVITE</Text>
                <Text style={{ fontSize: 20 }}>✓</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeBadge, styles.skipBadge, { opacity: skipOpacity }]}>
                <Text style={{ fontSize: 20 }}>✗</Text>
                <Text style={styles.skipBadgeText}>SKIP</Text>
              </Animated.View>
              <SwipeCardInner user={topUser} />
            </Animated.View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      {topUser && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.skipActionBtn} onPress={() => actionRef.current(-1)} activeOpacity={0.8}>
            <Text style={styles.skipActionIcon}>✕</Text>
            <Text style={styles.skipActionLabel}>Skip</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>swipe or tap</Text>
          </View>
          <TouchableOpacity style={styles.inviteActionBtn} onPress={() => actionRef.current(1)} activeOpacity={0.8}>
            <Text style={styles.inviteActionIcon}>♥</Text>
            <Text style={styles.inviteActionLabel}>Invite</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  progressPills: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  progressDot:   { width: 8, height: 8, borderRadius: 4 },

  stackContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'absolute',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardFront: { zIndex: 30 },
  cardMid:   { zIndex: 20, top: 10 },
  cardBack:  { zIndex: 10, top: 20, transform: [{ scale: 0.88 }], opacity: 0.6 },

  photoArea: {
    height: CARD_HEIGHT * 0.62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoInitials: { fontSize: 80, fontWeight: '800', color: 'rgba(0,0,0,0.25)' },
  activityTag: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  activityTagEmoji: { fontSize: 16 },
  activityTagLabel: { fontSize: 13, fontWeight: '700' },
  onlinePill: {
    position: 'absolute', bottom: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlinePillText: { fontSize: 12, color: colors.white, fontWeight: '600' },

  infoArea: { flex: 1, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface },
  infoName:     { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  infoLocation: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  infoTime:     { fontSize: 12, color: colors.textMuted },
  infoBio:      { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  swipeBadge: {
    position: 'absolute', top: 40, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 3,
  },
  inviteBadge: {
    left: 20,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: colors.success,
    transform: [{ rotate: '-15deg' }],
  },
  inviteBadgeText: { fontSize: 18, fontWeight: '800', color: colors.success },
  skipBadge: {
    right: 20,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: colors.danger,
    transform: [{ rotate: '15deg' }],
  },
  skipBadgeText: { fontSize: 18, fontWeight: '800', color: colors.danger },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingVertical: 16, gap: 20,
  },
  skipActionBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.danger,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  skipActionIcon:  { fontSize: 22, color: colors.danger },
  skipActionLabel: { fontSize: 10, color: colors.danger, fontWeight: '600', marginTop: 2 },
  inviteActionBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  inviteActionIcon:  { fontSize: 26, color: colors.white },
  inviteActionLabel: { fontSize: 10, color: colors.white, fontWeight: '600', marginTop: 2 },

  emptyCard: {
    width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    padding: 32, borderWidth: 1, borderColor: colors.border,
  },
  restartBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: radius.full, marginTop: 24,
  },
});
