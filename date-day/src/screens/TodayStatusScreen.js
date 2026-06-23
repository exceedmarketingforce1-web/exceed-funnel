import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const ACTIVITIES = [
  { id: 'coffee', emoji: '☕', label: 'Coffee', color: colors.coffee, bg: '#FEF3C7' },
  { id: 'happyHour', emoji: '🍸', label: 'Happy Hour', color: colors.happyHour, bg: '#EDE9FE' },
  { id: 'casualBites', emoji: '🌮', label: 'Casual Bites', color: colors.casualBites, bg: '#FEF9C3' },
];

const NEIGHBORHOODS = [
  'Downtown', 'Midtown', 'Uptown', 'East Side', 'West Side',
  'The Heights', 'Montrose', 'Midtown East', 'SoHo', 'Brooklyn',
];

export default function TodayStatusScreen({ onStatusChange }) {
  const [isFree, setIsFree] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [neighborhood, setNeighborhood] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredNeighborhoods = NEIGHBORHOODS.filter(n =>
    n.toLowerCase().includes(neighborhood.toLowerCase()) && neighborhood.length > 0
  );

  const handleToggle = (value) => {
    setIsFree(value);
    if (!value) {
      setSelectedActivity(null);
      onStatusChange && onStatusChange({ isFree: false });
    }
  };

  const handleActivitySelect = (activityId) => {
    setSelectedActivity(activityId);
    onStatusChange && onStatusChange({ isFree, activity: activityId, neighborhood });
  };

  const handleNeighborhoodSelect = (n) => {
    setNeighborhood(n);
    setShowSuggestions(false);
    onStatusChange && onStatusChange({ isFree, activity: selectedActivity, neighborhood: n });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey there 👋</Text>
          <Text style={styles.title}>Today's Status</Text>
          <Text style={styles.subtitle}>Set your availability and find someone to meet up with — today.</Text>
        </View>

        {/* Free Toggle Card */}
        <View style={[styles.card, isFree && styles.cardActive]}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>I'm Free Today</Text>
              <Text style={styles.toggleSub}>
                {isFree ? 'You\'re visible to others nearby' : 'Toggle on to start matching'}
              </Text>
            </View>
            <Switch
              value={isFree}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isFree ? colors.primary : colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
          {isFree && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>Active until midnight</Text>
            </View>
          )}
        </View>

        {/* Activity Cards */}
        {isFree && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What sounds good?</Text>
              <Text style={styles.sectionSub}>Pick the vibe for tonight</Text>
            </View>
            <View style={styles.activityRow}>
              {ACTIVITIES.map((activity) => {
                const isSelected = selectedActivity === activity.id;
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      { backgroundColor: activity.bg },
                      isSelected && styles.activityCardSelected,
                      isSelected && { borderColor: activity.color },
                    ]}
                    onPress={() => handleActivitySelect(activity.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: activity.color }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                    <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                    <Text style={[styles.activityLabel, isSelected && { color: activity.color }]}>
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Neighborhood Input */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Neighborhood</Text>
              <Text style={styles.sectionSub}>Where are you hanging around?</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Midtown, Downtown..."
                placeholderTextColor={colors.textMuted}
                value={neighborhood}
                onChangeText={(text) => {
                  setNeighborhood(text);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
            </View>

            {showSuggestions && filteredNeighborhoods.length > 0 && (
              <View style={styles.suggestions}>
                {filteredNeighborhoods.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={styles.suggestionItem}
                    onPress={() => handleNeighborhoodSelect(n)}
                  >
                    <Text style={styles.suggestionText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Status Summary */}
            {selectedActivity && neighborhood.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Status</Text>
                <Text style={styles.summaryText}>
                  {ACTIVITIES.find(a => a.id === selectedActivity)?.emoji}{' '}
                  {ACTIVITIES.find(a => a.id === selectedActivity)?.label} · {neighborhood}
                </Text>
                <Text style={styles.summaryHint}>You're now visible to people nearby. Check Discover!</Text>
              </View>
            )}
          </>
        )}

        {!isFree && (
          <View style={styles.offStateCard}>
            <Text style={styles.offStateEmoji}>💤</Text>
            <Text style={styles.offStateTitle}>You're invisible right now</Text>
            <Text style={styles.offStateText}>
              Toggle "I'm Free Today" to show up in others' Discover feed and start getting invited out.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  header: { paddingTop: spacing.lg, marginBottom: spacing.lg },
  greeting: { ...typography.label, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: { borderColor: colors.primaryLight, backgroundColor: '#FFF5F7' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...typography.h4, color: colors.text, marginBottom: 2 },
  toggleSub: { ...typography.bodySmall, color: colors.textSecondary },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FFD6DE',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  activeBadgeText: { ...typography.caption, color: colors.success, fontWeight: '600' },

  sectionHeader: { marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { ...typography.h4, color: colors.text },
  sectionSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

  activityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  activityCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  activityCardSelected: { borderWidth: 2 },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  activityEmoji: { fontSize: 28, marginBottom: spacing.xs },
  activityLabel: { ...typography.label, color: colors.text, textAlign: 'center' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  inputIcon: { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 14,
    ...typography.body,
    color: colors.text,
  },

  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { ...typography.body, color: colors.text },

  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  summaryTitle: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryText: { ...typography.h4, color: colors.white, marginBottom: 6 },
  summaryHint: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },

  offStateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offStateEmoji: { fontSize: 48, marginBottom: spacing.md },
  offStateTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  offStateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
