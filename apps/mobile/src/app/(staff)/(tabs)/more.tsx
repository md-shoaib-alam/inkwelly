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
import { AboutAppModal } from '@/components/AboutAppModal';
import { ProfileCard } from '@/components/ProfileCard';
import { hasPermission, staffHasNoGrants } from '@/lib/permissions';

export default function StaffMoreScreen() {
  const { user, logout } = useAuth();
  const { themeMode, activeTheme, setThemeMode, apiBaseUrl } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
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

  // Build dynamic menu based on permissions
  const dutyItems = [
    { icon: 'checkbox-outline', label: 'My Tasks', color: '#34C759', route: '/(staff)/(tabs)/tasks', show: true },
    { icon: 'checkmark-circle-outline', label: 'My Attendance', color: '#007AFF', route: '/(staff)/(tabs)/attendance', show: true },
    { icon: 'calendar-outline', label: 'Leave Requests', color: '#FF9500', route: '/(staff)/(tabs)/leaves', show: true },
  ].filter(i => i.show);

  const academicItems = [
    { icon: 'people-outline', label: 'Students', color: '#AF52DE', route: '/(staff)/(tabs)/students', show: hasPermission(user, 'students', 'view') },
    { icon: 'business-outline', label: 'Teachers', color: '#5856D6', route: '/(staff)/(tabs)/teachers', show: hasPermission(user, 'teachers', 'view') },
    { icon: 'school-outline', label: 'Classes', color: '#FF2D55', route: '/(staff)/(tabs)/classes', show: hasPermission(user, 'classes', 'view') },
    { icon: 'book-outline', label: 'Subjects', color: '#34C759', route: '/(staff)/(tabs)/subjects', show: hasPermission(user, 'subjects', 'view') },
  ].filter(i => i.show);

  const financeItems = [
    { icon: 'wallet-outline', label: 'Fee Management', color: '#007AFF', route: '/(staff)/(tabs)/fees', show: hasPermission(user, 'fees', 'view') },
    { icon: 'cash-outline', label: 'Expenses', color: '#FF3B30', route: '/(staff)/(tabs)/expenses', show: hasPermission(user, 'expenses', 'view') },
  ].filter(i => i.show);

  const opsItems = [
    { icon: 'megaphone-outline', label: 'School Notices', color: '#34C759', route: '/(admin)/(tabs)/notices', show: true },
    { icon: 'ticket-outline', label: 'Service Tickets', color: '#007AFF', route: '/(staff)/(tabs)/tickets', show: true },
    { icon: 'information-circle-outline', label: 'About App', color: '#8E8E93', route: null, show: true },
  ].filter(i => i.show);

  const accountItems = [
    { icon: 'person-circle-outline', label: 'Profile Settings', color: '#007AFF', route: '/(staff)/(tabs)/profile', show: true },
    { icon: 'key-outline', label: 'Change Password', color: '#FF9500', route: 'change_password', show: true },
  ].filter(i => i.show);

  const menuSections = [];
  if (dutyItems.length > 0) menuSections.push({ title: 'Duty & Logistics', items: dutyItems });
  if (academicItems.length > 0) menuSections.push({ title: 'Academic Management', items: academicItems });
  if (financeItems.length > 0) menuSections.push({ title: 'Finance', items: financeItems });
  if (opsItems.length > 0) menuSections.push({ title: 'Operations & Support', items: opsItems });
  if (accountItems.length > 0) menuSections.push({ title: 'Account Settings', items: accountItems });

  const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'system', label: 'System', icon: 'options-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        {/* User Card */}
        {user && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(staff)/(tabs)/profile' as any)}>
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
        {staffHasNoGrants(user) && (
          <View style={{ marginBottom: 20 }}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Access</ThemedText>
            <View style={[styles.menuList, { backgroundColor: colors.backgroundElement, padding: 14 }]}>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                Academic and finance screens appear here once your school admin assigns your staff
                role a module under Admin → Roles & Permissions.
              </ThemedText>
            </View>
          </View>
        )}
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
                      setChangePasswordVisible(true);
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

      {/* Change Password Modal */}
      <ChangePasswordModal 
        visible={changePasswordVisible} 
        onDismiss={() => setChangePasswordVisible(false)} 
      />

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
});
