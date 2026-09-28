import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Animated, useWindowDimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSettings, ThemeMode } from '@/store/settings-context';
import { api } from '@/lib/api';
import { ChangePasswordModal } from '@/modules/auth/components/ChangePasswordModal';
import { AboutAppModal } from '@/modules/platform/components/AboutAppModal';
import { ProfileCard } from '@/modules/auth/components/ProfileCard';

export default function ParentMoreScreen() {
  const { user, logout } = useAuth();
  const { themeMode, activeTheme, setThemeMode, apiBaseUrl } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [aboutVisible, setAboutVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buttonWidth = (width - 32 - 16) / 3;
  const themeAnim = React.useRef(new Animated.Value(
    themeMode === 'system' ? 0 : themeMode === 'light' ? 1 : 2
  )).current;

  React.useEffect(() => {
    let toValue = 0;
    if (themeMode === 'light') toValue = 1;
    else if (themeMode === 'dark') toValue = 2;

    Animated.spring(themeAnim, {
      toValue,
      useNativeDriver: true,
      tension: 110,
      friction: 11,
    }).start();
  }, [themeMode]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and all your data will be deleted in compliance with Data Safety guidelines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete('/auth/delete-account') as any;
              if (res && res.success) {
                await logout();
                router.replace('/' as any);
                Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              } else {
                Alert.alert('Error', res?.error || 'Failed to delete account.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const menuSections = [
    {
      title: 'Academic Details',
      items: [
        { icon: 'ribbon-outline', label: 'Grades & Report Cards', color: '#FF2D55', route: '/(parent)/(tabs)/grades' },
        { icon: 'document-text-outline', label: 'Homework Assignments', color: '#AF52DE', route: '/(parent)/(tabs)/homework' },
        { icon: 'calendar-number-outline', label: 'Class Timetable', color: '#5856D6', route: '/(parent)/(tabs)/timetable' },
      ]
    },
    {
      title: 'Finance & Notices',
      items: [
        { icon: 'wallet-outline', label: 'Fee Payments', color: '#FF9500', route: '/(parent)/(tabs)/fees' },
        { icon: 'megaphone-outline', label: 'School Notices', color: '#34C759', route: '/(admin)/(tabs)/notices' },
        { icon: 'ticket-outline', label: 'Support Helpdesk', color: '#007AFF', route: '/(parent)/(tabs)/tickets' },
      ]
    },
    {
      title: 'Account & Settings',
      items: [
        { icon: 'people-outline', label: 'Child Profile', color: '#34C759', route: '/(parent)/(tabs)/child-profile' },
        { icon: 'person-circle-outline', label: 'Profile Settings', color: '#007AFF', route: '/(parent)/(tabs)/profile' },
        { icon: 'card-outline', label: 'Premium Subscription', color: '#FFD700', route: '/(parent)/subscription' },
        { icon: 'key-outline', label: 'Change Password', color: '#AF52DE', route: 'change_password' },
        { icon: 'information-circle-outline', label: 'About Application', color: '#8E8E93', route: null },
      ]
    }
  ];

  const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'system', label: 'System', icon: 'options-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <ThemedView style={styles.container} safeAreaTop>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#FF9500']} />
        }
      >
        {/* User Card */}
        {user && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(parent)/(tabs)/profile' as any)}>
            <ProfileCard user={user} />
          </TouchableOpacity>
        )}

        {/* API IP Address Configuration */}
        <View style={{ marginBottom: 10 }}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>API Connection Settings</ThemedText>
          <View style={[styles.configCard, { backgroundColor: colors.backgroundElement, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }]}>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
              Current API URL
            </ThemedText>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 13, color: '#007AFF' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {apiBaseUrl}
            </ThemedText>
          </View>
        </View>

        {/* Dynamic Menu Sections */}
        {menuSections.map((section, secIdx) => (
          <View key={`sec-${secIdx}`} style={{ marginBottom: 20 }}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={[styles.menuList, { backgroundColor: colors.backgroundElement }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }
                  ]}
                  onPress={() => {
                    if (item.route === 'change_password') {
                      router.push('/change-password');
                    } else if (item.label === 'About Application') {
                      setAboutVisible(true);
                    } else if (item.route) {
                      router.push(item.route as any);
                    } else {
                      Alert.alert(item.label, 'This feature is fully integrated and synced with the main School Web portal.');
                    }
                  }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Theme Settings */}
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>App Theme</ThemedText>
        <View style={[styles.themeRow, { backgroundColor: colors.backgroundElement }]}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 8,
              width: buttonWidth,
              backgroundColor: '#007AFF',
              borderRadius: 10,
              transform: [
                {
                  translateX: themeAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, buttonWidth, buttonWidth * 2],
                  }),
                },
                {
                  scaleX: themeAnim.interpolate({
                    inputRange: [0, 0.5, 1, 1.5, 2],
                    outputRange: [1, 1.25, 1, 1.25, 1],
                  }),
                },
              ],
            }}
          />
          {themeOptions.map((opt) => {
            const isSelected = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                style={styles.themeButton}
                onPress={() => setThemeMode(opt.mode)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={opt.icon} 
                  size={18} 
                  color={isSelected ? '#FFF' : colors.textSecondary} 
                  style={{ marginBottom: 4 }} 
                />
                <ThemedText style={[
                  styles.themeButtonText,
                  { color: isSelected ? '#FFF' : colors.text }
                ]}>
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>



      {/* About App Modal */}
      <AboutAppModal
        visible={aboutVisible}
        onDismiss={() => setAboutVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
    opacity: 0.8,
  },
  configCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  ipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveIpButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIpButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  themeRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 8,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  deleteAccountButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
