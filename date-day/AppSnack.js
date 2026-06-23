// Date Day — Nashville Edition
// Paste entire file into App.js in a new Expo Snack
// Add deps: @react-navigation/native @react-navigation/bottom-tabs react-native-safe-area-context

import React, { useState, useEffect, useRef, useReducer } from 'react';
import {
  View, Text, Switch, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Animated, Alert, PanResponder, Dimensions,
  StatusBar, Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
const CARD_W      = W - 40;
const CARD_H      = H * 0.60;
const SWIPE_T     = W * 0.27;
const MATCH_DUR   = 3 * 60 * 60 * 1000;   // 3 h
const STATUS_TTL  = 2 * 60 * 60 * 1000;   // 2 h auto-expire
const SAFETY_AT   = 30 * 60 * 1000;        // 30 min post-match

// ─── Dark Theme ───────────────────────────────────────────────────────────────
const D = {
  bg:         '#0D0D14',
  surface:    '#16161F',
  surfaceAlt: '#1E1E2A',
  raised:     '#26263A',
  primary:    '#FF4B6E',
  primaryDim: 'rgba(255,75,110,0.14)',
  text:       '#EDEDF5',
  textSec:    '#8888A8',
  textMuted:  '#44445A',
  border:     '#2A2A3E',
  success:    '#22C55E',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  white:      '#FFFFFF',
};
const T = {
  h1:  { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: D.text },
  h2:  { fontSize: 22, fontWeight: '700', color: D.text },
  h3:  { fontSize: 17, fontWeight: '600', color: D.text },
  h4:  { fontSize: 14, fontWeight: '600', color: D.text },
  body:{ fontSize: 14, color: D.text },
  sm:  { fontSize: 12, color: D.textSec },
  cap: { fontSize: 11, color: D.textMuted },
  btn: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
};

// ─── Nashville Venues DB ──────────────────────────────────────────────────────
const VENUES = {
  'East Nashville': [
    { name: 'Frothy Monkey',       type: 'coffee',      emoji: '☕', deal: '15% off tab',             address: '235 5th Ave N' },
    { name: 'Vinyl Tap',           type: 'happyHour',   emoji: '🍸', deal: 'Free app with 2 drinks',  address: '1308 McGavock Pike' },
    { name: 'The Pharmacy Burger', type: 'casualBites', emoji: '🌮', deal: '10% off burgers',          address: '731 McFerrin Ave' },
  ],
  'The Gulch': [
    { name: 'Barista Parlor',      type: 'coffee',      emoji: '☕', deal: 'BOGO Latte',              address: '610 Magazine St' },
    { name: "Gertie's Whiskey Bar",type: 'happyHour',   emoji: '🍸', deal: '15% off drinks',          address: '214 11th Ave S' },
    { name: 'Peg Leg Porker',      type: 'casualBites', emoji: '🌮', deal: 'Free side with platter',  address: '903 Gleaves St' },
  ],
  'Midtown/Vandy': [
    { name: 'Fido',                type: 'coffee',      emoji: '☕', deal: '10% off combo',           address: '1812 21st Ave S' },
    { name: 'The Patterson House', type: 'happyHour',   emoji: '🍸', deal: '$2 off specialty cocktail',address: '1711 Division St' },
    { name: "Hattie B's Hot Chicken",type:'casualBites',emoji: '🌮', deal: 'Free drink with meal',    address: '112 19th Ave S' },
  ],
  'Germantown': [
    { name: 'Red Bicycle',         type: 'coffee',      emoji: '☕', deal: '15% off crepes',          address: '3 City Ave' },
    { name: 'Monday Night Brewing',type: 'happyHour',   emoji: '🍸', deal: 'BOGO pints',              address: '1018 4th Ave N' },
    { name: "Von Elrod's",         type: 'casualBites', emoji: '🌮', deal: 'Free pretzel w/ large beer',address:'1033 Jefferson St'},
  ],
};
const HOODS = Object.keys(VENUES);

const ACT = {
  coffee:      { emoji: '☕', label: 'Coffee',       color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  happyHour:   { emoji: '🍸', label: 'Happy Hour',   color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  casualBites: { emoji: '🌮', label: 'Casual Bites', color: '#16A34A', bg: 'rgba(22,163,74,0.15)' },
};

const TIME_SLOTS = [
  'Now (ASAP)', '12:00 PM – 2:00 PM', '2:00 PM – 5:00 PM',
  '5:00 PM – 7:00 PM', '7:00 PM – 9:00 PM', '9:00 PM – Close',
];

// ─── Mock Profiles ────────────────────────────────────────────────────────────
const PROFILES = [
  {
    id: '1', name: 'Sarah', age: 26, neighborhood: 'East Nashville',
    activities: ['coffee', 'casualBites'], timeSlot: '2:00 PM – 5:00 PM',
    score: 98, badge: true, strikes: 0, timedOut: false,
    initials: 'S', avatarColor: '#C2185B', bio: 'East Side native. Coffee shop regular. Huge Predators fan.',
  },
  {
    id: '2', name: 'Marcus', age: 29, neighborhood: 'The Gulch',
    activities: ['happyHour', 'casualBites'], timeSlot: '5:00 PM – 7:00 PM',
    score: 82, badge: false, strikes: 1, timedOut: false,
    initials: 'M', avatarColor: '#512DA8', bio: 'Whiskey lover. Weekend chef. Always know the best spots.',
  },
  {
    id: '3', name: 'Jordan', age: 31, neighborhood: 'Germantown',
    activities: ['coffee', 'happyHour'], timeSlot: '12:00 PM – 2:00 PM',
    score: 100, badge: true, strikes: 0, timedOut: false,
    initials: 'J', avatarColor: '#1B5E20', bio: 'Germantown local. Craft beer enthusiast. Remote designer.',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const genCoupon = () => String(Math.floor(100000 + Math.random() * 900000));

function fmtTime(ms) {
  if (ms <= 0) return '0:00:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const scoreColor = (n) => n >= 90 ? D.success : n >= 70 ? D.warning : D.danger;

// ─── Global State ─────────────────────────────────────────────────────────────
const INIT = {
  isFree: false, activities: [], hood: 'Midtown/Vandy', slot: null, statusAt: null,
  score: 100, badge: true, strikes: 0, timedOut: false,
  match: null,   // { profile, venue, matchedAt, myArrived, theirArrived, coupon, couponUsed, safetyShown, safetySeen }
  swipeIdx: 0,
};

function reducer(state, { type, ...p }) {
  switch (type) {
    case 'SET_FREE':
      return { ...state, isFree: p.v, statusAt: p.v ? Date.now() : null, activities: p.v ? state.activities : [] };
    case 'TOGGLE_ACT': {
      const cur = state.activities;
      return cur.includes(p.id)
        ? { ...state, activities: cur.filter(x => x !== p.id) }
        : cur.length >= 2 ? state
        : { ...state, activities: [...cur, p.id] };
    }
    case 'SET_HOOD':   return { ...state, hood: p.v };
    case 'SET_SLOT':   return { ...state, slot: p.v };
    case 'EXPIRE':     return { ...state, isFree: false, statusAt: null };
    case 'NEXT_SWIPE': return { ...state, swipeIdx: state.swipeIdx + 1 };
    case 'RESET_SWIPE':return { ...state, swipeIdx: 0 };
    case 'RECONSIDER': return { ...state, activities: [p.activity], hood: p.hood };
    case 'CREATE_MATCH':
      return { ...state, match: { profile: p.profile, venue: p.venue, matchedAt: Date.now(), myArrived: false, theirArrived: false, coupon: genCoupon(), couponUsed: false, safetyShown: false, safetySeen: false } };
    case 'ARRIVED':
      return { ...state, match: { ...state.match, myArrived: true, theirArrived: true } };
    case 'COUPON_USED':
      return { ...state, match: { ...state.match, couponUsed: true } };
    case 'SAFETY_SHOW':
      return { ...state, match: { ...state.match, safetyShown: true } };
    case 'SAFETY_SEEN':
      return { ...state, match: { ...state.match, safetySeen: true } };
    case 'CANCEL': {
      const strikes = state.strikes + 1;
      return { ...state, match: null, strikes, timedOut: strikes >= 2, score: Math.max(0, state.score - 15), badge: strikes === 0 };
    }
    default: return state;
  }
}

// ─── AccountabilityBadge ──────────────────────────────────────────────────────
function AccountabilityBadge({ score, badge, strikes }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
      {strikes >= 2 ? (
        <View style={[g.tag, { backgroundColor: D.raised, borderColor: D.textMuted }]}>
          <Text style={[T.cap, { color: D.textMuted }]}>⏸ Timed Out</Text>
        </View>
      ) : strikes === 1 ? (
        <View style={[g.tag, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: D.danger }]}>
          <Text style={[T.cap, { color: D.danger, fontWeight: '700' }]}>✗ Strike</Text>
        </View>
      ) : null}
      {badge && (
        <View style={[g.tag, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: D.success }]}>
          <Text style={[T.cap, { color: D.success, fontWeight: '700' }]}>✓ Reliable</Text>
        </View>
      )}
      <View style={[g.tag, { backgroundColor: D.raised, borderColor: D.border }]}>
        <Text style={[T.cap, { color: scoreColor(score), fontWeight: '700' }]}>{score}%</Text>
      </View>
    </View>
  );
}

// ─── Venue Reveal Modal ───────────────────────────────────────────────────────
function VenueRevealModal({ visible, profile, onMatch, onMoveOn, onReconsider }) {
  const [sel, setSel] = useState(null);
  const slideY = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    Animated.spring(slideY, { toValue: visible ? 0 : H, tension: 80, friction: 13, useNativeDriver: true }).start();
    if (!visible) setSel(null);
  }, [visible]);

  if (!profile) return null;
  const venues = VENUES[profile.neighborhood] || [];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onMoveOn}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
        <Animated.View style={{ transform: [{ translateY: slideY }], backgroundColor: D.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 }}>
          {/* Profile strip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: D.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: profile.avatarColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.5)' }}>{profile.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{profile.name}'s spots in {profile.neighborhood}</Text>
              <AccountabilityBadge score={profile.score} badge={profile.badge} strikes={profile.strikes} />
            </View>
          </View>

          <Text style={[T.sm, { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }]}>Tap a venue to select it, then choose your action:</Text>

          {/* Venue list */}
          {venues.map((v, i) => {
            const meta = ACT[v.type];
            const active = sel?.name === v.name;
            return (
              <TouchableOpacity
                key={i}
                style={{ marginHorizontal: 16, marginVertical: 5, borderRadius: 14, padding: 14, backgroundColor: active ? D.primaryDim : D.surfaceAlt, borderWidth: 1.5, borderColor: active ? D.primary : D.border }}
                onPress={() => setSel(v)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{v.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h4}>{v.name}</Text>
                    <Text style={[T.cap, { color: D.textSec }]}>📍 {v.address}</Text>
                  </View>
                  <View style={{ backgroundColor: meta.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={[T.cap, { color: meta.color, fontWeight: '700' }]}>🎟 {v.deal}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
            <TouchableOpacity style={[g.btn, { backgroundColor: D.raised, flex: 1 }]} onPress={onMoveOn}>
              <Text style={[T.btn, { color: D.textSec }]}>Move On</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[g.btn, { backgroundColor: D.surfaceAlt, flex: 1, borderWidth: 1, borderColor: D.warning, opacity: sel ? 1 : 0.45 }]}
              onPress={() => sel ? onReconsider(sel, profile.neighborhood) : Alert.alert('Select a venue first')}
            >
              <Text style={[T.btn, { color: D.warning }]}>Reconsider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[g.btn, { backgroundColor: D.primary, flex: 1, opacity: sel ? 1 : 0.45 }]}
              onPress={() => sel ? onMatch(sel) : Alert.alert('Select a venue to match!')}
            >
              <Text style={[T.btn, { color: D.white }]}>Match! 💘</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Safety Check-In Modal ────────────────────────────────────────────────────
function SafetyModal({ visible, onResponse }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: D.surface, borderRadius: 24, padding: 24, width: '100%', borderWidth: 1.5, borderColor: D.primary }}>
          <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 10 }}>🛡️</Text>
          <Text style={[T.h2, { textAlign: 'center', marginBottom: 6 }]}>30-Minute Check-In</Text>
          <Text style={[T.body, { color: D.textSec, textAlign: 'center', lineHeight: 22, marginBottom: 22 }]}>
            You've been matched for 30 minutes. Is everything going well?
          </Text>
          <View style={{ gap: 10 }}>
            {[
              { label: '👍  All good!', res: 'great', bg: D.success },
              { label: '🤔  It\'s fine', res: 'ok',    bg: D.warning },
              { label: '🆘  I need help', res: 'help', bg: D.danger },
            ].map(({ label, res, bg }) => (
              <TouchableOpacity key={res} style={[g.btn, { backgroundColor: bg }]} onPress={() => onResponse(res)}>
                <Text style={[T.btn, { color: D.white }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Swipe Card Content ───────────────────────────────────────────────────────
function CardContent({ profile }) {
  const { name, age, neighborhood, score, badge, strikes, timedOut, bio, avatarColor, initials, activities, timeSlot } = profile;
  return (
    <View style={{ flex: 1 }}>
      {/* Photo */}
      <View style={{ height: CARD_H * 0.58, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Text style={{ fontSize: 68, fontWeight: '900', color: 'rgba(255,255,255,0.22)' }}>{initials}</Text>

        {/* Strike badge */}
        {strikes >= 1 && !timedOut && (
          <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: D.danger, borderRadius: 999, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: D.white }}>
            <Text style={{ color: D.white, fontSize: 14, fontWeight: '900' }}>✗</Text>
          </View>
        )}

        {/* Timeout overlay */}
        {timedOut && (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>⏸</Text>
            <Text style={[T.h4, { color: D.white, textAlign: 'center' }]}>Booking window full{'\n'}until next month</Text>
          </View>
        )}

        {/* Activity pills */}
        <View style={{ position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', gap: 6 }}>
          {activities.map(a => (
            <View key={a} style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 15 }}>{ACT[a].emoji}</Text>
            </View>
          ))}
        </View>

        {/* Free Today pill */}
        <View style={{ position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: D.success }} />
          <Text style={[T.cap, { color: D.white }]}>Free Today</Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ flex: 1, backgroundColor: D.surface, paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <View>
            <Text style={[T.h2, { fontSize: 21 }]}>{name}, {age}</Text>
            <Text style={[T.sm, { color: D.textSec }]}>📍 {neighborhood}</Text>
          </View>
          <AccountabilityBadge score={score} badge={badge} strikes={strikes} />
        </View>
        <Text style={[T.cap, { color: D.textSec, marginBottom: 6 }]}>🕐 {timeSlot}</Text>
        <Text style={[T.sm, { color: D.textSec, lineHeight: 19 }]} numberOfLines={2}>{bio}</Text>
      </View>
    </View>
  );
}

// ─── Tab 1: Today's Status ────────────────────────────────────────────────────
function TodayStatusScreen({ state, dispatch }) {
  const { isFree, activities, hood, slot, statusAt, timedOut } = state;

  const [ttlDisplay, setTtlDisplay] = useState(STATUS_TTL);
  useEffect(() => {
    if (!isFree || !statusAt) return;
    const id = setInterval(() => {
      const left = STATUS_TTL - (Date.now() - statusAt);
      if (left <= 0) { dispatch({ type: 'EXPIRE' }); clearInterval(id); }
      else setTtlDisplay(left);
    }, 10000);
    return () => clearInterval(id);
  }, [isFree, statusAt]);

  if (timedOut) return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🚫</Text>
        <Text style={[T.h2, { color: D.danger, textAlign: 'center', marginBottom: 12 }]}>Account Suspended</Text>
        <Text style={[T.body, { color: D.textSec, textAlign: 'center', lineHeight: 22 }]}>2 strikes this month. Your account is on a 30-day timeout. Come back next month fresh.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <ScrollView contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
        <Text style={T.h1}>Today's Status</Text>
        <Text style={[T.sm, { marginTop: 3, marginBottom: 20 }]}>Nashville · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>

        {/* Free toggle */}
        <View style={[g.card, isFree && { borderColor: D.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={T.h3}>I'm Free Today</Text>
              <Text style={[T.sm, { marginTop: 2 }]}>{isFree ? 'Visible in Nashville feed' : 'Toggle to join the feed'}</Text>
            </View>
            <Switch value={isFree} onValueChange={v => dispatch({ type: 'SET_FREE', v })} trackColor={{ false: D.border, true: D.primary }} thumbColor={D.white} ios_backgroundColor={D.border} />
          </View>
          {isFree && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: D.border }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: D.success, marginRight: 8 }} />
              <Text style={[T.sm, { color: D.success }]}>Auto-expires in {fmtTime(ttlDisplay)}</Text>
            </View>
          )}
        </View>

        {isFree && (
          <>
            {/* Activities */}
            <Text style={[T.h4, { marginTop: 22, marginBottom: 12 }]}>What sounds good? <Text style={{ color: D.textSec, fontWeight: '400' }}>(pick up to 2)</Text></Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {Object.entries(ACT).map(([id, meta]) => {
                const on = activities.includes(id);
                return (
                  <TouchableOpacity key={id} style={[g.actCard, { backgroundColor: on ? meta.bg : D.surfaceAlt, borderColor: on ? meta.color : D.border }]} onPress={() => dispatch({ type: 'TOGGLE_ACT', id })} activeOpacity={0.8}>
                    {on && <View style={g.checkDot}><Text style={{ color: D.white, fontSize: 9, fontWeight: '900' }}>✓</Text></View>}
                    <Text style={{ fontSize: 28, marginBottom: 5 }}>{meta.emoji}</Text>
                    <Text style={[T.sm, { color: on ? meta.color : D.textSec, fontWeight: '600', textAlign: 'center' }]}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Neighborhood */}
            <Text style={[T.h4, { marginTop: 22, marginBottom: 12 }]}>Your Neighborhood</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {HOODS.map(n => {
                const on = hood === n;
                return (
                  <TouchableOpacity key={n} style={[g.chip, on && { backgroundColor: D.primaryDim, borderColor: D.primary }]} onPress={() => dispatch({ type: 'SET_HOOD', v: n })}>
                    <Text style={[T.sm, { color: on ? D.primary : D.textSec, fontWeight: on ? '700' : '400' }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Partner venues preview */}
            {hood && (
              <View style={{ marginTop: 12 }}>
                <Text style={[T.cap, { color: D.textMuted, marginBottom: 8 }]}>PARTNER VENUES IN {hood.toUpperCase()}</Text>
                {VENUES[hood].map((v, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 6 }}>
                    <Text style={{ fontSize: 18 }}>{v.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={T.h4}>{v.name}</Text>
                    </View>
                    <View style={{ backgroundColor: ACT[v.type].bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={[T.cap, { color: ACT[v.type].color, fontWeight: '700' }]}>{v.deal}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Time Slot */}
            <Text style={[T.h4, { marginTop: 22, marginBottom: 12 }]}>Preferred Time</Text>
            <View style={{ gap: 8 }}>
              {TIME_SLOTS.map(s => {
                const on = slot === s;
                return (
                  <TouchableOpacity key={s} style={[g.slotBtn, on && { backgroundColor: D.primaryDim, borderColor: D.primary }]} onPress={() => dispatch({ type: 'SET_SLOT', v: s })}>
                    <Text style={[T.body, { color: on ? D.primary : D.textSec }]}>🕐 {s}</Text>
                    {on && <Text style={{ color: D.primary, fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live status card */}
            {activities.length > 0 && slot && (
              <View style={[g.card, { backgroundColor: D.primaryDim, borderColor: D.primary, marginTop: 20 }]}>
                <Text style={[T.cap, { color: D.primary, fontWeight: '700', marginBottom: 4 }]}>🟢 YOUR STATUS IS LIVE</Text>
                <Text style={T.h3}>{activities.map(a => ACT[a].emoji + ' ' + ACT[a].label).join('  ·  ')}</Text>
                <Text style={[T.sm, { color: D.textSec, marginTop: 5 }]}>📍 {hood}  ·  🕐 {slot}</Text>
              </View>
            )}
          </>
        )}

        {!isFree && (
          <View style={[g.card, { alignItems: 'center', padding: 36, marginTop: 18 }]}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>💤</Text>
            <Text style={[T.h3, { textAlign: 'center', marginBottom: 8 }]}>You're Invisible</Text>
            <Text style={[T.body, { color: D.textSec, textAlign: 'center', lineHeight: 22 }]}>Toggle "I'm Free Today" to appear in the Nashville feed and start matching.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tab 2: Discover ──────────────────────────────────────────────────────────
function DiscoverScreen({ state, dispatch, navigation }) {
  const { isFree, activities, swipeIdx } = state;
  const [revealProfile, setRevealProfile] = useState(null);
  const position = useRef(new Animated.ValueXY()).current;
  const idxRef   = useRef(swipeIdx);
  useEffect(() => { idxRef.current = swipeIdx; }, [swipeIdx]);

  const rotate   = position.x.interpolate({ inputRange: [-W / 2, 0, W / 2], outputRange: ['-12deg', '0deg', '12deg'], extrapolate: 'clamp' });
  const inviteOp = position.x.interpolate({ inputRange: [0, SWIPE_T], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOp   = position.x.interpolate({ inputRange: [-SWIPE_T, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const secScale = position.x.interpolate({ inputRange: [-W, 0, W], outputRange: [1, 0.93, 1], extrapolate: 'clamp' });

  const actionRef = useRef(null);
  actionRef.current = (dir) => {
    const profile = PROFILES[idxRef.current];
    if (!profile) return;
    Animated.timing(position, { toValue: { x: dir * W * 1.5, y: dir * 50 }, duration: 240, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      dispatch({ type: 'NEXT_SWIPE' });
      if (dir > 0) setRevealProfile(profile);
    });
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.2 }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_T) actionRef.current(1);
      else if (g.dx < -SWIPE_T) actionRef.current(-1);
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
    },
  })).current;

  if (!isFree) return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 58, marginBottom: 18 }}>🌆</Text>
        <Text style={[T.h2, { textAlign: 'center', marginBottom: 12 }]}>Nashville is Waiting</Text>
        <Text style={[T.body, { color: D.textSec, textAlign: 'center', lineHeight: 22 }]}>Toggle "I'm Free Today" on the Status tab to join the Nashville feed!</Text>
      </View>
    </SafeAreaView>
  );

  const top = PROFILES[swipeIdx];
  const sec = PROFILES[swipeIdx + 1];
  const tri = PROFILES[swipeIdx + 2];

  return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={T.h1}>Discover</Text>
        <Text style={T.sm}>{Math.max(0, PROFILES.length - swipeIdx)} in Nashville</Text>
      </View>

      {/* Card stack */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {!top ? (
          <View style={[g.swipeCard, { backgroundColor: D.surface, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>🎉</Text>
            <Text style={[T.h3, { textAlign: 'center', marginBottom: 8 }]}>You've seen everyone!</Text>
            <Text style={[T.body, { color: D.textSec, textAlign: 'center' }]}>Check back later for new Nashvillians.</Text>
            <TouchableOpacity style={[g.primaryBtn, { marginTop: 22 }]} onPress={() => dispatch({ type: 'RESET_SWIPE' })}>
              <Text style={[T.btn, { color: D.white }]}>Start Over</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {tri && <View style={[g.swipeCard, { position: 'absolute', transform: [{ scale: 0.87 }], top: 20, zIndex: 10, opacity: 0.5 }]}><CardContent profile={tri} /></View>}
            {sec && <Animated.View style={[g.swipeCard, { position: 'absolute', transform: [{ scale: secScale }], top: 10, zIndex: 20 }]}><CardContent profile={sec} /></Animated.View>}
            <Animated.View style={[g.swipeCard, { position: 'absolute', zIndex: 30, transform: [...position.getTranslateTransform(), { rotate }] }]} {...pan.panHandlers}>
              <Animated.View style={[g.badge, g.badgeInvite, { opacity: inviteOp }]}><Text style={[T.btn, { color: D.success }]}>MATCH 💘</Text></Animated.View>
              <Animated.View style={[g.badge, g.badgeSkip,   { opacity: skipOp   }]}><Text style={[T.btn, { color: D.danger  }]}>SKIP ✗</Text></Animated.View>
              <CardContent profile={top} />
            </Animated.View>
          </>
        )}
      </View>

      {/* Buttons */}
      {top && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, gap: 28 }}>
          <TouchableOpacity style={g.skipBtn} onPress={() => actionRef.current(-1)} activeOpacity={0.8}>
            <Text style={{ fontSize: 22, color: D.danger }}>✕</Text>
            <Text style={[T.cap, { color: D.danger, marginTop: 2 }]}>Skip</Text>
          </TouchableOpacity>
          <Text style={[T.cap, { color: D.textMuted }]}>swipe or tap</Text>
          <TouchableOpacity style={g.matchBtn} onPress={() => actionRef.current(1)} activeOpacity={0.8}>
            <Text style={{ fontSize: 24 }}>💘</Text>
            <Text style={[T.cap, { color: D.white, marginTop: 2 }]}>Match</Text>
          </TouchableOpacity>
        </View>
      )}

      <VenueRevealModal
        visible={!!revealProfile}
        profile={revealProfile}
        onMatch={(venue) => {
          const p = revealProfile;
          setRevealProfile(null);
          dispatch({ type: 'CREATE_MATCH', profile: p, venue });
          navigation.navigate('Match');
        }}
        onMoveOn={() => setRevealProfile(null)}
        onReconsider={(venue, hood) => {
          const p = revealProfile;
          setRevealProfile(null);
          dispatch({ type: 'RECONSIDER', activity: venue.type, hood });
          dispatch({ type: 'CREATE_MATCH', profile: p, venue });
          Alert.alert(
            "It's a Perfect Match! 🎉",
            `You both chose ${venue.name} today!\n\nYour date is locked in.`,
            [{ text: "Let's Go!", onPress: () => navigation.navigate('Match') }]
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─── Tab 3: Active Match ──────────────────────────────────────────────────────
function ActiveMatchScreen({ state, dispatch }) {
  const { match } = state;
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSafety, setShowSafety] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!match) return;
    setTimeLeft(Math.max(0, MATCH_DUR - (Date.now() - match.matchedAt)));
    const id = setInterval(() => {
      const left = Math.max(0, MATCH_DUR - (Date.now() - match.matchedAt));
      setTimeLeft(left);
      const elapsed = Date.now() - match.matchedAt;
      if (elapsed >= SAFETY_AT && !match.safetyShown) {
        dispatch({ type: 'SAFETY_SHOW' });
        setShowSafety(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [match?.matchedAt, match?.safetyShown]);

  useEffect(() => {
    if (timeLeft < SAFETY_AT && timeLeft > 0) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 480, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 480, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [timeLeft < SAFETY_AT]);

  if (!match) return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 58, marginBottom: 18 }}>💘</Text>
        <Text style={[T.h2, { textAlign: 'center', marginBottom: 12 }]}>No Active Match</Text>
        <Text style={[T.body, { color: D.textSec, textAlign: 'center', lineHeight: 22 }]}>Swipe right in Discover to match with someone and lock in a same-day Nashville meetup.</Text>
      </View>
    </SafeAreaView>
  );

  const { profile, venue, myArrived, theirArrived, coupon, couponUsed } = match;
  const urgent     = timeLeft < SAFETY_AT;
  const tc         = urgent ? D.danger : timeLeft < 60 * 60 * 1000 ? D.warning : D.success;
  const bothIn     = myArrived && theirArrived;
  const venueMeta  = ACT[venue.type];

  return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <ScrollView contentContainerStyle={g.pad}>

        {/* Countdown */}
        <Animated.View style={[g.card, { borderColor: tc, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', transform: urgent ? [{ scale: pulse }] : [] }]}>
          <View>
            <Text style={[T.sm, { color: tc }]}>{urgent ? '⚠️ Almost out of time!' : '⏱ Date window closes in'}</Text>
            <Text style={{ fontSize: 34, fontWeight: '900', color: tc, letterSpacing: 2, marginTop: 4 }}>{fmtTime(timeLeft)}</Text>
          </View>
          <View style={{ backgroundColor: D.primaryDim, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 28 }}>💘</Text>
          </View>
        </Animated.View>

        {/* Match info */}
        <View style={[g.card, { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }]}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: profile.avatarColor, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>{profile.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>Matched with {profile.name}</Text>
            <AccountabilityBadge score={profile.score} badge={profile.badge} strikes={profile.strikes} />
          </View>
        </View>

        {/* Venue */}
        <View style={[g.card, { marginTop: 12 }]}>
          <Text style={[T.cap, { color: D.textSec, marginBottom: 10 }]}>📍 YOUR VENUE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: venueMeta.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{venue.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{venue.name}</Text>
              <Text style={[T.sm, { color: D.textSec }]}>📍 {venue.address}, Nashville TN</Text>
              <View style={{ marginTop: 5, alignSelf: 'flex-start', backgroundColor: venueMeta.bg, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={[T.cap, { color: venueMeta.color, fontWeight: '700' }]}>🎟 {venue.deal}</Text>
              </View>
            </View>
          </View>
          {/* Map placeholder */}
          <View style={{ borderRadius: 12, backgroundColor: D.raised, height: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: D.border }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🗺️</Text>
            <Text style={[T.sm, { color: D.textSec }]}>{venue.address}, Nashville, TN</Text>
            <Text style={[T.cap, { color: D.textMuted, marginTop: 2 }]}>Tap for turn-by-turn directions</Text>
          </View>
        </View>

        {/* GPS Check-In */}
        {!bothIn ? (
          <TouchableOpacity
            style={[g.card, { backgroundColor: D.primaryDim, borderColor: D.primary, alignItems: 'center', padding: 20, marginTop: 12 }]}
            onPress={() => Alert.alert('Simulate GPS Check-In', `Confirm arrival at ${venue.name}?\n\nThis simulates a 100-meter GPS check-in.`, [
              { text: '📍 Confirm Arrival', onPress: () => dispatch({ type: 'ARRIVED' }) },
              { text: 'Cancel', style: 'cancel' },
            ])}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📍</Text>
            <Text style={[T.btn, { color: D.primary }]}>Simulate Arrival at Venue</Text>
            <Text style={[T.cap, { color: D.textSec, marginTop: 4 }]}>100 m GPS check-in required for both users</Text>
          </TouchableOpacity>
        ) : (
          <View style={[g.card, { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: D.success, alignItems: 'center', padding: 18, marginTop: 12 }]}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>✅</Text>
            <Text style={[T.h4, { color: D.success }]}>Both Safely Arrived!</Text>
            <Text style={[T.sm, { color: D.textSec, marginTop: 4 }]}>Accountability scores updated ↑</Text>
          </View>
        )}

        {/* Coupon */}
        {bothIn && (
          <View style={[g.card, { marginTop: 12, alignItems: 'center', borderColor: D.warning }]}>
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🎟️</Text>
            <Text style={[T.cap, { color: D.textSec, marginBottom: 4 }]}>SHARED PARTNER CODE — SINGLE USE</Text>
            <Text style={{ fontSize: 38, fontWeight: '900', color: couponUsed ? D.textMuted : D.warning, letterSpacing: 7, marginVertical: 8, textDecorationLine: couponUsed ? 'line-through' : 'none' }}>
              {coupon}
            </Text>
            {couponUsed ? (
              <View style={[g.tag, { backgroundColor: D.raised }]}>
                <Text style={[T.sm, { color: D.textMuted }]}>✓ Code Redeemed — single use only</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={g.primaryBtn}
                onPress={() => Alert.alert('Redeem Code?', `Show this to your server:\n\n${coupon}\n\nThis code is single-use only.`, [
                  { text: 'Redeem Now', onPress: () => dispatch({ type: 'COUPON_USED' }) },
                  { text: 'Later', style: 'cancel' },
                ])}
              >
                <Text style={[T.btn, { color: D.white }]}>Redeem at Counter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel */}
        <TouchableOpacity
          style={[g.card, { borderColor: D.danger, backgroundColor: 'rgba(239,68,68,0.07)', alignItems: 'center', padding: 14, marginTop: 12 }]}
          onPress={() => Alert.alert('⚠️ Cancel Date?', 'Canceling adds a strike to your profile.\n\n• 1 Strike: Red ✗ visible on your card for the month\n• 2 Strikes: 30-day app timeout', [
            { text: 'Cancel My Date', style: 'destructive', onPress: () => dispatch({ type: 'CANCEL' }) },
            { text: 'Keep My Date', style: 'cancel' },
          ])}
          activeOpacity={0.8}
        >
          <Text style={[T.sm, { color: D.danger, fontWeight: '700' }]}>Cancel Date  (adds strike)</Text>
        </TouchableOpacity>

      </ScrollView>

      <SafetyModal
        visible={showSafety && !match.safetySeen}
        onResponse={(res) => {
          dispatch({ type: 'SAFETY_SEEN' });
          setShowSafety(false);
          if (res === 'help') Alert.alert('Emergency Support', 'Nashville Non-Emergency: (615) 862-8600\nNational Crisis Line: 988\n\nYour safety is the priority.', [{ text: 'OK' }]);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Tab 4: Profile ───────────────────────────────────────────────────────────
function ProfileScreen({ state }) {
  const { score, badge, strikes, timedOut, hood, activities } = state;
  return (
    <SafeAreaView style={g.safe} edges={['top']}>
      <ScrollView contentContainerStyle={g.pad}>
        <Text style={T.h1}>My Profile</Text>

        {/* Avatar */}
        <View style={[g.card, { alignItems: 'center', padding: 28, marginTop: 12 }]}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: D.white }}>A</Text>
          </View>
          <Text style={[T.h2, { marginBottom: 4 }]}>Alex, 28</Text>
          <Text style={[T.sm, { color: D.textSec, marginBottom: 12 }]}>📍 {hood} · Nashville, TN</Text>
          <AccountabilityBadge score={score} badge={badge} strikes={strikes} />
        </View>

        {/* Accountability Score */}
        <View style={[g.card, { marginTop: 12 }]}>
          <Text style={[T.h4, { marginBottom: 14 }]}>Accountability Score</Text>
          <View style={{ height: 10, backgroundColor: D.raised, borderRadius: 5, marginBottom: 10 }}>
            <View style={{ height: 10, borderRadius: 5, width: `${score}%`, backgroundColor: scoreColor(score) }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={T.cap}>0%</Text>
            <Text style={[T.sm, { color: scoreColor(score), fontWeight: '700' }]}>{score}% — {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}</Text>
            <Text style={T.cap}>100%</Text>
          </View>

          {/* Strikes */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            {[0, 1].map(i => (
              <View key={i} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: strikes > i ? 'rgba(239,68,68,0.12)' : D.surfaceAlt, borderWidth: 1, borderColor: strikes > i ? D.danger : D.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, color: strikes > i ? D.danger : D.textMuted }}>{strikes > i ? '✗' : '○'}</Text>
                <Text style={[T.cap, { color: strikes > i ? D.danger : D.textMuted, marginTop: 4 }]}>Strike {i + 1}</Text>
              </View>
            ))}
          </View>

          {timedOut && (
            <View style={{ marginTop: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: D.danger }}>
              <Text style={[T.sm, { color: D.danger, fontWeight: '700' }]}>🚫 30-Day Timeout Active</Text>
              <Text style={[T.cap, { color: D.textSec, marginTop: 4 }]}>App access resumes next month.</Text>
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={[g.card, { marginTop: 12 }]}>
          <Text style={[T.h4, { marginBottom: 14 }]}>Badges</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { icon: badge ? '✅' : '○',  label: 'Reliable\nMember',   earned: badge,        tint: D.success },
              { icon: score===100?'⭐':'○', label: 'Perfect\nScore',     earned: score===100,  tint: D.warning },
              { icon: '🎸',                 label: 'Nashville\nOG',       earned: true,         tint: D.primary },
            ].map(({ icon, label, earned, tint }) => (
              <View key={label} style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, backgroundColor: earned ? tint + '18' : D.surfaceAlt, borderColor: earned ? tint : D.border }}>
                <Text style={{ fontSize: 22, marginBottom: 5 }}>{icon}</Text>
                <Text style={[T.cap, { color: earned ? tint : D.textMuted, textAlign: 'center', lineHeight: 16 }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's prefs */}
        {activities.length > 0 && (
          <View style={[g.card, { marginTop: 12 }]}>
            <Text style={[T.h4, { marginBottom: 12 }]}>Today's Preferences</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {activities.map(a => (
                <View key={a} style={[g.chip, { backgroundColor: ACT[a].bg, borderColor: ACT[a].color }]}>
                  <Text style={[T.sm, { color: ACT[a].color, fontWeight: '600' }]}>{ACT[a].emoji} {ACT[a].label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nashville partner note */}
        <View style={[g.card, { marginTop: 12, backgroundColor: D.primaryDim, borderColor: D.primary }]}>
          <Text style={[T.h4, { marginBottom: 6 }]}>🎸 Nashville Exclusive</Text>
          <Text style={[T.sm, { color: D.textSec, lineHeight: 20 }]}>Date Day is currently in exclusive local rollout across East Nashville, The Gulch, Midtown/Vandy, and Germantown. Partner venues are verified and updated weekly.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const NAV_THEME = {
  dark: true,
  colors: { background: D.bg, card: D.surface, text: D.text, border: D.border, notification: D.primary, primary: D.primary },
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);

  // App-level 2-hour status expiry
  useEffect(() => {
    if (!state.isFree || !state.statusAt) return;
    const id = setInterval(() => {
      if (Date.now() - state.statusAt > STATUS_TTL) dispatch({ type: 'EXPIRE' });
    }, 30000);
    return () => clearInterval(id);
  }, [state.isFree, state.statusAt]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />
      <NavigationContainer theme={NAV_THEME}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: D.surface, borderTopWidth: 1, borderTopColor: D.border, height: Platform.OS === 'ios' ? 84 : 62, paddingBottom: Platform.OS === 'ios' ? 22 : 8, paddingTop: 8 },
            tabBarActiveTintColor: D.primary,
            tabBarInactiveTintColor: D.textMuted,
            tabBarIcon: ({ focused }) => {
              const icons = { Status: ['🌟','☀️'], Discover: ['💘','🔍'], Match: ['📍','📍'], Profile: ['👤','👤'] };
              return <Text style={{ fontSize: 20 }}>{icons[route.name][focused ? 0 : 1]}</Text>;
            },
            tabBarLabel: ({ focused }) => {
              const labels = { Status: "Status", Discover: 'Discover', Match: 'Match', Profile: 'Profile' };
              return <Text style={{ fontSize: 10, color: focused ? D.primary : D.textMuted, fontWeight: focused ? '700' : '400', marginTop: 2 }}>{labels[route.name]}</Text>;
            },
            tabBarBadge: route.name === 'Match' && state.match ? '!' : undefined,
          })}
        >
          <Tab.Screen name="Status">
            {props => <TodayStatusScreen  {...props} state={state} dispatch={dispatch} />}
          </Tab.Screen>
          <Tab.Screen name="Discover">
            {props => <DiscoverScreen     {...props} state={state} dispatch={dispatch} />}
          </Tab.Screen>
          <Tab.Screen name="Match">
            {props => <ActiveMatchScreen  {...props} state={state} dispatch={dispatch} />}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {props => <ProfileScreen      {...props} state={state} dispatch={dispatch} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const g = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: D.bg },
  pad:        { paddingHorizontal: 16, paddingBottom: 44, paddingTop: 10 },
  card:       { backgroundColor: D.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: D.border, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: D.surfaceAlt, borderWidth: 1, borderColor: D.border },
  btn:        { padding: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtn: { backgroundColor: D.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  actCard:    { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, position: 'relative' },
  checkDot:   { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  slotBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: D.surfaceAlt, borderWidth: 1, borderColor: D.border },
  // Swipe deck
  swipeCard:  { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', backgroundColor: D.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 8 },
  badge:      { position: 'absolute', top: 36, zIndex: 99, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 2.5 },
  badgeInvite:{ left: 18,  backgroundColor: 'rgba(34,197,94,0.14)', borderColor: D.success, transform: [{ rotate: '-14deg' }] },
  badgeSkip:  { right: 18, backgroundColor: 'rgba(239,68,68,0.14)', borderColor: D.danger,  transform: [{ rotate: '14deg'  }] },
  skipBtn:    { width: 60, height: 60, borderRadius: 30, backgroundColor: D.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: D.danger },
  matchBtn:   { width: 70, height: 70, borderRadius: 35, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 7 },
});
