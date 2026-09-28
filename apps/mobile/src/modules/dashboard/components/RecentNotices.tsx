import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'expo-router';

interface RecentNoticesProps {
  data: { id: string; title: string; content: string; date?: string }[];
}

export function RecentNotices({ data }: RecentNoticesProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { user } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Get current year and month for filtering (e.g., "2026-06")
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = `${monthNames[now.getMonth()]} ${currentYear}`;

  // Filter notices to show only the current month
  const filteredData = data.filter((notice) => {
    if (!notice.date) return false;
    return notice.date.startsWith(currentYearMonth);
  });

  const handleSeeAll = () => {
    if (isAdmin) {
      router.push('/(admin)/(tabs)/notices');
    } else {
      setModalVisible(true);
    }
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: activeTheme === 'light' ? '#FFFFFF' : '#1A1E2E',
        borderColor: activeTheme === 'light' ? '#E8F0FE' : '#252A3D'
      }
    ]}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: activeTheme === 'light' ? '#EBF5FF' : '#1E293B' }]}>
            <Ionicons name="megaphone" size={18} color="#007AFF" />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Recent Notices</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Updates & Announcements</ThemedText>
          </View>
        </View>
        <View style={[styles.monthBadge, { backgroundColor: colors.backgroundSelected }]}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.monthBadgeText, { color: colors.textSecondary }]}>{currentMonthName}</ThemedText>
        </View>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={32} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.6 }} />
          <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13 }}>
            No notices for this month.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredData.map((notice) => (
            <View 
              key={notice.id} 
              style={[
                styles.noticeItem, 
                { 
                  backgroundColor: activeTheme === 'light' ? '#F4F8FF' : '#21263A',
                  borderColor: activeTheme === 'light' ? '#E0ECFF' : '#2A304D'
                }
              ]}
            >
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.noticeTitle}>{notice.title}</ThemedText>
                  <View style={[styles.dateBadge, { backgroundColor: colors.backgroundSelected }]}>
                    <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>{notice.date}</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.noticeBody, { color: colors.textSecondary }]}>
                  {notice.content}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}

      {data.length > 0 && (
        <TouchableOpacity 
          style={[styles.seeAllButton, { borderColor: colors.backgroundSelected }]} 
          onPress={handleSeeAll}
        >
          <ThemedText style={{ color: '#007AFF', fontSize: 13, fontWeight: '600' }}>See All Notices</ThemedText>
          <Ionicons name="arrow-forward" size={14} color="#007AFF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}

      {/* School Notices Full Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundSelected }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>School Notices</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12, opacity: 0.6 }} />
                <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  No school notices found.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.modalList}>
                {data.map((notice) => (
                  <View 
                    key={notice.id} 
                    style={[
                      styles.noticeItem, 
                      { 
                        backgroundColor: activeTheme === 'light' ? '#F4F8FF' : '#21263A',
                        borderColor: activeTheme === 'light' ? '#E0ECFF' : '#2A304D'
                      }
                    ]}
                  >
                    <View style={styles.noticeContent}>
                      <View style={styles.noticeHeader}>
                        <ThemedText type="defaultSemiBold" style={styles.noticeTitle}>{notice.title}</ThemedText>
                        <View style={[styles.dateBadge, { backgroundColor: colors.backgroundSelected }]}>
                          <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>{notice.date}</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.noticeBody, { color: colors.textSecondary }]}>
                        {notice.content}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  listContainer: {
    gap: 12,
  },
  noticeItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  noticeContent: {
    padding: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  dateBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 16,
  },
  modalList: {
    gap: 12,
  },
});


