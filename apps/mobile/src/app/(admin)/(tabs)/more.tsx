import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Text, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSettings, ThemeMode } from '@/store/settings-context';
import { ChangePasswordModal } from '@/modules/auth/components/ChangePasswordModal';
import { StaffManagementModal } from '@/modules/people/components/StaffManagementModal';
import { AboutAppModal } from '@/modules/platform/components/AboutAppModal';
import { ProfileCard } from '@/modules/auth/components/ProfileCard';
import { Portal, Dialog, Button } from 'react-native-paper';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { themeMode, activeTheme, setThemeMode, apiBaseUrl } = useSettings();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [staffVisible, setStaffVisible] = useState(false);
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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Categorized groups of menu items (Top Section)
  const topMenus = [
    ...(isAdmin ? [
      {
        title: 'Attendance Management',
        items: [
          { icon: 'people-outline', label: 'Student Attendance', color: '#AF52DE' },
          { icon: 'school-outline', label: 'Teacher Attendance', color: '#FF9500' },
          { icon: 'briefcase-outline', label: 'Staff Attendance', color: '#5856D6' },
        ]
      },
      {
        title: 'Academic Setup',
        items: [
          { icon: 'calendar-outline', label: 'Academic Years', color: '#FF9500' },
          { icon: 'business-outline', label: 'Classes & Sections', color: '#007AFF' },
          { icon: 'book-outline', label: 'Subjects Management', color: '#AF52DE' },
          { icon: 'calendar-number-outline', label: 'Timetables', color: '#5856D6' },
          { icon: 'calendar-outline', label: 'Academic Calendar & Events', color: '#34C759' },
        ]
      },
      {
        title: 'User Management',
        items: [
          { icon: 'people-outline', label: 'Staff Management', color: '#34C759' },
          { icon: 'school-outline', label: 'Teachers Management', color: '#FF9500' },
          { icon: 'people-circle-outline', label: 'Parents Management', color: '#AF52DE' },
          { icon: 'shield-checkmark-outline', label: 'Roles & Permissions', color: '#FF3B30' },
        ]
      },
      {
        title: 'Student Operations',
        items: [
          { icon: 'trending-up-outline', label: 'Student Promotions', color: '#007AFF' },
          { icon: 'ribbon-outline', label: 'Certificates Management', color: '#5856D6' },
        ]
      },
      {
        title: 'Announcements',
        items: [
          { icon: 'megaphone-outline', label: 'School Notices', color: '#34C759' },
        ]
      },
      {
        title: 'Leave Management',
        items: [
          { icon: 'calendar-outline', label: 'Staff Leave Management', color: '#FF3B30' },
          { icon: 'school-outline', label: 'Student Leave Management', color: '#007AFF' },
        ]
      },
      {
        title: 'Finance & Subscriptions',
        items: [
          { icon: 'wallet-outline', label: 'Expenses Status', color: '#FF9500' },
          { icon: 'card-outline', label: 'School Subscription', color: '#007AFF' },
        ]
      }
    ] : []),
    {
      title: 'Help & Support',
      items: [
        { icon: 'ticket-outline', label: 'Support Tickets', color: '#34C759' },
        { icon: 'notifications-outline', label: 'Notification Settings', color: '#FF9500' },
        { icon: 'information-circle-outline', label: 'About App', color: '#5856D6' },
      ]
    }
  ];

  // Categorized groups of menu items (Bottom Section)
  const bottomMenus = [
    {
      title: 'Account Settings',
      items: [
        { icon: 'person-circle-outline', label: 'Profile Settings', color: '#007AFF' },
        { icon: 'key-outline', label: 'Change Password', color: '#007AFF' },
      ]
    },
    ...(isAdmin ? [
      {
        title: 'School Config',
        items: [
          { icon: 'settings-outline', label: 'School Settings', color: '#8E8E93' },
        ]
      }
    ] : [])
  ];

  const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'system', label: 'System', icon: 'options-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<{ id: string; title: string; date: string; type: string }[]>([
    { id: '1', title: 'Summer Vacation Starts', date: '2026-06-15', type: 'holiday' },
    { id: '2', title: 'First Term Exams', date: '2026-07-10', type: 'exam' },
    { id: '3', title: 'Parent-Teacher Meeting', date: '2026-07-28', type: 'event' },
  ]);

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
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(admin)/(tabs)/profile')}>
            <ProfileCard user={user} />
          </TouchableOpacity>
        )}

        {/* API IP Address Configuration Settings */}
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>API Connection Settings</ThemedText>
        <View style={[styles.configCard, { backgroundColor: colors.backgroundElement, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }]}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
            Current API URL
          </ThemedText>
          <ThemedText style={{ fontWeight: 'bold', fontSize: 13, color: '#007AFF' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {apiBaseUrl}
          </ThemedText>
        </View>



        {/* Top categorized menu items sections */}
        {topMenus.map((section, secIdx) => (
          <View key={`top-${secIdx}`} style={{ marginBottom: 20 }}>
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
                    const rolePath = user?.role === 'admin' || user?.role === 'super_admin'
                      ? '/(admin)/(tabs)'
                      : user?.role === 'teacher'
                        ? '/(teacher)/(tabs)'
                        : '/(student)/(tabs)';

                    if (item.label === 'Profile Settings') {
                      router.push(`${rolePath}/profile`);
                    } else if (item.label === 'Support Tickets') {
                      router.push(`${rolePath}/tickets`);
                    } else if (item.label === 'Change Password') {
                      router.push('/change-password');
                    } else if (item.label === 'Academic Calendar & Events') {
                      router.push('/(admin)/(tabs)/calendar');
                    } else if (item.label === 'School Settings') {
                      router.push('/(admin)/(tabs)/school-settings');
                    } else if (item.label === 'Staff Management') {
                      router.push('/(admin)/(tabs)/staff');
                    } else if (item.label === 'Teachers Management') {
                      router.push('/(admin)/(tabs)/teachers');
                    } else if (item.label === 'Parents Management') {
                      router.push('/(admin)/(tabs)/parents');
                    } else if (item.label === 'Roles & Permissions') {
                      router.push('/(admin)/(tabs)/roles');
                    } else if (item.label === 'Timetables') {
                      router.push('/(admin)/(tabs)/timetable');
                    } else if (item.label === 'Academic Years') {
                      router.push('/(admin)/(tabs)/academic-years');
                    } else if (item.label === 'Subjects Management') {
                      router.push('/(admin)/(tabs)/subjects');
                    } else if (item.label === 'Certificates Management') {
                      router.push('/(admin)/(tabs)/certificates');
                    } else if (item.label === 'Student Promotions') {
                      router.push('/(admin)/(tabs)/promotions');
                    } else if (item.label === 'Classes & Sections') {
                      router.push('/(admin)/(tabs)/classes');
                    } else if (item.label === 'Staff Leave Management') {
                      router.push('/(admin)/(tabs)/leaves');
                    } else if (item.label === 'Student Leave Management') {
                      router.push('/(admin)/(tabs)/student-leaves');
                    } else if (item.label === 'Expenses Status') {
                      router.push('/(admin)/(tabs)/expenses');
                    } else if (item.label === 'School Notices') {
                      router.push('/(admin)/(tabs)/notices');
                    } else if (item.label === 'Student Attendance') {
                      router.push('/(admin)/(tabs)/attendance-students');
                    } else if (item.label === 'Teacher Attendance') {
                      router.push('/(admin)/(tabs)/attendance-teachers');
                    } else if (item.label === 'Staff Attendance') {
                      router.push('/(admin)/(tabs)/attendance-staff');
                    } else if (item.label === 'About App') {
                      setAboutVisible(true);
                    } else {
                      Alert.alert(item.label, 'This administrative action is fully managed synced from the main School web dashboard.');
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

        {/* Bottom categorized menu items sections */}
        {bottomMenus.map((section, secIdx) => (
          <View key={`bottom-${secIdx}`} style={{ marginBottom: 20 }}>
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
                    const rolePath = user?.role === 'admin' || user?.role === 'super_admin'
                      ? '/(admin)/(tabs)'
                      : user?.role === 'teacher'
                        ? '/(teacher)/(tabs)'
                        : '/(student)/(tabs)';

                    if (item.label === 'Profile Settings') {
                      router.push(`${rolePath}/profile`);
                    } else if (item.label === 'Support Tickets') {
                      router.push(`${rolePath}/tickets`);
                    } else if (item.label === 'Change Password') {
                      router.push('/change-password');
                    } else if (item.label === 'Academic Calendar & Events') {
                      setCalendarVisible(true);
                    } else if (item.label === 'School Settings') {
                      router.push('/(admin)/(tabs)/school-settings');
                    } else if (item.label === 'Staff Management') {
                      router.push('/(admin)/(tabs)/staff');
                    } else if (item.label === 'Teachers Management') {
                      router.push('/(admin)/(tabs)/teachers');
                    } else if (item.label === 'Parents Management') {
                      router.push('/(admin)/(tabs)/parents');
                    } else if (item.label === 'Roles & Permissions') {
                      router.push('/(admin)/(tabs)/roles');
                    } else if (item.label === 'Timetables') {
                      router.push('/(admin)/(tabs)/timetable');
                    } else if (item.label === 'Academic Years') {
                      router.push('/(admin)/(tabs)/academic-years');
                    } else if (item.label === 'Subjects Management') {
                      router.push('/(admin)/(tabs)/subjects');
                    } else if (item.label === 'Certificates Management') {
                      router.push('/(admin)/(tabs)/certificates');
                    } else if (item.label === 'Staff Leave Management') {
                      router.push('/(admin)/(tabs)/leaves');
                    } else if (item.label === 'Student Leave Management') {
                      router.push('/(admin)/(tabs)/student-leaves');
                    } else if (item.label === 'Expenses Status') {
                      router.push('/(admin)/(tabs)/expenses');
                    } else if (item.label === 'School Notices') {
                      router.push('/(admin)/(tabs)/notices');
                    } else {
                      Alert.alert(item.label, 'This administrative action is fully managed synced from the main School web dashboard.');
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>





      {/* About App Modal */}
      <AboutAppModal
        visible={aboutVisible}
        onDismiss={() => setAboutVisible(false)}
      />

      {/* Staff Management Modal */}
      <StaffManagementModal
        visible={staffVisible}
        onDismiss={() => setStaffVisible(false)}
      />

      {/* Interactive Academic Calendar Modal */}
      <Portal>
        <Dialog 
          visible={calendarVisible} 
          onDismiss={() => setCalendarVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Academic Calendar & Events</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300, borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}>
              {calendarEvents.map((evt) => (
                <View 
                  key={evt.id} 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingVertical: 12, 
                    borderBottomWidth: 1, 
                    borderBottomColor: colors.backgroundSelected 
                  }}
                >
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: evt.type === 'holiday' ? '#34C759' : evt.type === 'exam' ? '#FF3B30' : '#007AFF', 
                    marginRight: 10 
                  }} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '600', fontSize: 14, color: colors.text }}>{evt.title}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{evt.date}</ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setCalendarVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  profileCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
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
