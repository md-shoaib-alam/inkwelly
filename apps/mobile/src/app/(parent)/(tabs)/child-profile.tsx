import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Sub-components
import { ChildSelector } from '@/modules/people/components/ParentChildSelector';
import { Skeleton } from '@/components/Skeleton';

const PARENT_DASHBOARD_QUERY = `
  query ParentDashboard($parentName: String!) {
    parentDashboard(parentName: $parentName) {
      children { 
        id name className rollNumber classId gender dateOfBirth admissionDate email
        grades { id subjectName examType marks maxMarks grade }
      }
    }
  }
`;



export default function ChildProfileScreen() {
  const { user } = useAuth();
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchChildProfileData = useCallback(async () => {
    if (!user?.name) return;
    try {
      const gqlRes = await api.post('/graphql', { query: PARENT_DASHBOARD_QUERY, variables: { parentName: user.name } }) as any;
      if (gqlRes.errors && gqlRes.errors.length > 0) {
        throw new Error(gqlRes.errors[0].message);
      }
      const data = gqlRes.data?.parentDashboard || {};
      const childList = data.children || [];
      setChildren(childList);
      if (childList.length > 0 && !selectedChildId) {
        setSelectedChildId(childList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch child profile details:', error);
    } finally {
      setHasLoaded(true);
    }
  }, [selectedChildId, setSelectedChildId, user?.name]);

  useFocusEffect(
    useCallback(() => {
      void fetchChildProfileData();
    }, [fetchChildProfileData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChildProfileData();
    setIsRefreshing(false);
  };

  const activeChild = useMemo(() => {
    return children.find(c => c.id === selectedChildId) || children[0];
  }, [children, selectedChildId]);

  if (!hasLoaded) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
          </View>
          <Skeleton width="100%" height={150} borderRadius={24} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={220} borderRadius={24} style={{ marginBottom: 20 }} />
          <Skeleton width="100%" height={160} borderRadius={24} />
        </ScrollView>
      </ThemedView>
    );
  }

  if (hasLoaded && children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
        >
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.backgroundSelected, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: colors.text }}>No Wards Linked</ThemedText>
            <ThemedText style={{ fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 20 }}>
              There are no student profiles currently linked to this parent account. Please contact the school administration to link your children.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  const initials = activeChild.name
    ? activeChild.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
      >
        <ChildSelector 
          students={children} 
          selectedStudentId={selectedChildId || children[0]?.id} 
          onSelect={setSelectedChildId} 
        />

        {/* Top Header Card */}
        <View style={[styles.mainInfoCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={isDark ? ['#3B82F6', '#1D4ED8'] : ['#007AFF', '#0056B3']}
              style={styles.avatarFallback}
            >
              <ThemedText style={styles.avatarFallbackText}>{initials}</ThemedText>
            </LinearGradient>
          </View>
          <View style={styles.mainInfoDetails}>
            <ThemedText style={styles.studentNameText}>{activeChild.name}</ThemedText>
            <View style={styles.classBadge}>
              <ThemedText style={styles.classBadgeText}>{activeChild.className || 'Class N/A'}</ThemedText>
            </View>
            {activeChild.email && (
              <View style={styles.emailRow}>
                <Ionicons name="mail" size={14} color={colors.textSecondary} />
                <ThemedText style={[styles.emailText, { color: colors.textSecondary }]}>{activeChild.email}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <Ionicons name="person-outline" size={20} color="#34C759" />
            </View>
            <ThemedText style={styles.cardTitle}>Personal Details</ThemedText>
          </View>

          <View style={styles.detailsList}>
            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Full Name</ThemedText>
              <ThemedText style={styles.detailValue}>{activeChild.name || 'N/A'}</ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</ThemedText>
              <ThemedText style={[styles.detailValue, { flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>{activeChild.email || 'N/A'}</ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Gender</ThemedText>
              <ThemedText style={[styles.detailValue, { textTransform: 'capitalize' }]}>{activeChild.gender || 'N/A'}</ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Date of Birth</ThemedText>
              <ThemedText style={styles.detailValue}>{activeChild.dateOfBirth || 'N/A'}</ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Class</ThemedText>
              <ThemedText style={styles.detailValue}>{activeChild.className || 'N/A'}</ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.backgroundSelected }]}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Roll Number</ThemedText>
              <ThemedText style={styles.detailValue}>{activeChild.rollNumber || 'N/A'}</ThemedText>
            </View>

            <View style={styles.detailItem}>
              <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>Admission Date</ThemedText>
              <ThemedText style={styles.detailValue}>{activeChild.admissionDate || 'N/A'}</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  mainInfoDetails: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  classBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  classBadgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontSize: 13,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statBoxDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardSubDetails: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsList: {
    gap: 14,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
