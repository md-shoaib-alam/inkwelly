import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Text, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSettings, ThemeMode } from '@/store/settings-context';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { ProfileCard } from '@/components/ProfileCard';
import { AboutAppModal } from '@/components/AboutAppModal';
import { Portal, Dialog, Button } from 'react-native-paper';

export default function TeacherMoreScreen() {
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
    router.replace('/');
  };

  const menuSections = [
    {
      title: 'Classroom & Academics',
      items: [
        { icon: 'business-outline', label: 'My Classes', color: '#007AFF', route: '/(teacher)/(tabs)/my-classes' },
        { icon: 'book-outline', label: 'My Subjects', color: '#34C759', route: '/(teacher)/(tabs)/my-subjects' },
        { icon: 'clipboard-outline', label: 'Assessments', color: '#AF52DE', route: '/(teacher)/(tabs)/assessments' },
        { icon: 'document-text-outline', label: 'Homework', color: '#AF52DE', route: '/(teacher)/(tabs)/homework' },
        { icon: 'create-outline', label: 'Exams & Grades Entry', color: '#FF2D55', route: '/(teacher)/(tabs)/exams-entry' },
      ]
    },
    {
      title: 'Operations & Support',
      items: [
        { icon: 'checkmark-circle-outline', label: 'My Attendance', color: '#2563EB', route: '/(teacher)/(tabs)/my-attendance' },
        { icon: 'megaphone-outline', label: 'School Notices', color: '#34C759', route: '/(admin)/(tabs)/notices' },
        { icon: 'calendar-outline', label: 'My Leaves', color: '#FF3B30', route: '/(teacher)/(tabs)/my-leaves' },
        { icon: 'ticket-outline', label: 'Support Tickets', color: '#007AFF', route: '/(teacher)/(tabs)/tickets' },
        { icon: 'information-circle-outline', label: 'About App', color: '#8E8E93', route: null },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { icon: 'person-circle-outline', label: 'Profile Settings', color: '#007AFF', route: '/(teacher)/(tabs)/profile' },
        { icon: 'key-outline', label: 'Change Password', color: '#FF9500', route: 'change_password' },
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
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(teacher)/(tabs)/profile')}>
            <ProfileCard user={user} />
          </TouchableOpacity>
        )}

        {/* API IP Address Configuration */}
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>API Connection Settings</ThemedText>
        <View style={[styles.configCard, { backgroundColor: colors.backgroundElement, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }]}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
            Current API URL
          </ThemedText>
          <ThemedText style={{ fontWeight: 'bold', fontSize: 13, color: '#007AFF' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {apiBaseUrl}
          </ThemedText>
        </View>

        {/* Dynamic Teacher Menu Sections */}
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
                    } else if (item.label === 'About App') {
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

        {/* Theme Selector Settings */}
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Theme Settings</ThemedText>
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
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
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#8e8e93',
    marginBottom: 8,
    marginLeft: 4,
  },
  configCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  configLabel: {
    fontSize: 13,
    marginBottom: 10,
  },
  ipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ipInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  saveIpButton: {
    backgroundColor: '#007AFF',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIpButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  helpText: {
    fontSize: 11,
    marginTop: 8,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
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
    height: 54,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
