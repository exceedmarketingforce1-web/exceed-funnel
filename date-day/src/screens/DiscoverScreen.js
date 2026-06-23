import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const ACTIVITY_META = {
  coffee: { emoji: '☕', label: 'Coffee', color: '#92400E', bg: '#FEF3C7' },
  happyHour: { emoji: '🍸', label: 'Happy Hour', color: '#7C3AED', bg: '#EDE9FE' },
  casualBites: { emoji: '🌮', label: 'Casual Bites', color: '#D97706', bg: '#FEF9C3' },
};

const MOCK_USERS = [
  {
    id: '1',
    name: 'Sophia',
    age: 28,
    neighborhood: 'Midtown',
    activity: 'coffee',
    bio: 'Grad student who loves good espresso and even better conversation.',
    initials: 'S',
    avatarColor: '#FFB3C6',
    minutesAgo: 5,
  },
  {
    id: '2',
    name: 'Marcus',
    age: 31,
    neighborhood: 'Downtown',
    activity: 'happyHour',
    bio: 'Creative director. Cocktails after a long week are non-negotiable.',
    initials: 'M',
    avatarColor: '#C4B5FD',
    minutesAgo: 12,
  },
  {
    id: '3',
    name: 'Priya',
    age: 26,
    neighborhood: 'East Side',
    activity: 'casualBites',
    bio: 'Foodie & photographer. Always down to try a new spot.',
    initials: 'P',
    avatarColor: '#86EFAC',
    minutesAgo: 3,
  },
  {
    id: '4',
    name: 'Jordan',
    age: 30,
    neighborhood: 'The Heights',
    activity: 'coffee',
    bio: 'UX designer. Coffee is basically a personality trait at this point.',
    initials: 'J',
    avatarColor: '#FCA5A5',
    minutesAgo: 20,
  },
  {
    id: '5',
    name: 'Alex',
    age: 27,
    neighborhood: 'West Side',
    activity: 'happyHour',
    bio: 'Music producer and part-time chef. Happy hours are my thing.',
    initials: 'A',
    avatarColor: '#7DD3FC',
    minutesAgo: 8,
  },
  {
    id: '6',
    name: 'Camille',
    age: 29,
    neighborhood: 'Uptown',
    activity: 'casualBites',
    bio: 'Architect who can debate tacos vs. burritos all day.',
    initials: 'C',
    avatarColor: '#FDE68A',
    minutesAgo: 35,
  },
];

function UserCard({ user, onInvite }) {
  const activity = ACTIVITY_META[user.activity];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
          <Text style={styles.avatarText}>{user.initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user.name}, {user.age}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{user.neighborhood}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timeText}>{user.minutesAgo}m ago</Text>
          </View>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: activity.bg }]}>
          <Text style={styles.activityEmoji}>{activity.emoji}</Text>
        </View>
      </View>

      <Text style={styles.bio}>{user.bio}</Text>

      <View style={styles.cardFooter}>
        <View style={[styles.activityPill, { backgroundColor: activity.bg }]}>
          <Text style={[styles.activityPillText, { color: activity.color }]}>
            {activity.emoji} {activity.label}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => onInvite(user)}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteBtnText}>Send Invite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DiscoverScreen({ navigation }) {
  const [invitedIds, setInvitedIds] = useState([]);

  const handleInvite = (user) => {
    if (invitedIds.includes(user.id)) return;
    setInvitedIds(prev => [...prev, user.id]);
    Alert.alert(
      'Invite Sent! 🎉',
      `You invited ${user.name} for ${ACTIVITY_META[user.activity].label}. You'll be connected in Active Chats once they accept.`,
      [
        {
          text: 'Open Chat',
          onPress: () => navigation.navigate('ActiveChats'),
          style: 'default',
        },
        { text: 'Keep Browsing', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{MOCK_USERS.length} free today</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_USERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
              <Text style={styles.filterChipTextActive}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>☕ Coffee</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>🍸 Happy Hour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>🌮 Bites</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onInvite={handleInvite}
            invited={invitedIds.includes(item.id)}
          />
        )}
      />
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
    justifyContent: 'space-between',
  },
  title: { ...typography.h1, color: colors.text },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  liveText: { ...typography.label, color: colors.success },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { ...typography.label, color: colors.textSecondary },
  filterChipTextActive: { ...typography.label, color: colors.white },

  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.text },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  userName: { ...typography.h4, color: colors.text },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationIcon: { fontSize: 12 },
  locationText: { ...typography.bodySmall, color: colors.textSecondary },
  dot: { ...typography.bodySmall, color: colors.textMuted },
  timeText: { ...typography.bodySmall, color: colors.textMuted },

  activityBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: { fontSize: 22 },

  bio: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  activityPillText: { ...typography.caption, fontWeight: '600' },

  inviteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  inviteBtnText: { ...typography.button, color: colors.white },
});
