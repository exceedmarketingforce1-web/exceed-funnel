import React, { useState } from 'react';
import { StatusBar, View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TodayStatusScreen from './src/screens/TodayStatusScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import ActiveChatsScreen from './src/screens/ActiveChatsScreen';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  TodayStatus: { active: '🌟', inactive: '☀️', label: "Today's Status" },
  Discover: { active: '💘', inactive: '🔍', label: 'Discover' },
  ActiveChats: { active: '💬', inactive: '💭', label: 'Chats' },
};

function TabIcon({ routeName, focused }) {
  const meta = TAB_ICONS[routeName];
  return (
    <View style={tabStyles.iconWrapper}>
      <Text style={tabStyles.iconEmoji}>{focused ? meta.active : meta.inactive}</Text>
    </View>
  );
}

function TabLabel({ routeName, focused }) {
  const label = TAB_ICONS[routeName]?.label;
  return (
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
      {label}
    </Text>
  );
}

export default function App() {
  const [userStatus, setUserStatus] = useState({ isFree: false });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: tabStyles.bar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarShowLabel: true,
            tabBarIcon: ({ focused }) => (
              <TabIcon routeName={route.name} focused={focused} />
            ),
            tabBarLabel: ({ focused }) => (
              <TabLabel routeName={route.name} focused={focused} />
            ),
          })}
        >
          <Tab.Screen name="TodayStatus">
            {(props) => (
              <TodayStatusScreen
                {...props}
                onStatusChange={(status) => setUserStatus(status)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Discover" component={DiscoverScreen} />
          <Tab.Screen name="ActiveChats" component={ActiveChatsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 22 },
  label: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  labelActive: { color: colors.primary, fontWeight: '700' },
});
