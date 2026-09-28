import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';

// Sub-components
import { ChildSelector } from '@/modules/people/components/ParentChildSelector';
import { Skeleton } from '@/components/Skeleton';

export default function ParentHomeworkScreen() {
  const { user } = useAuth();
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];

  const { width } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'pending' | 'completed'>('pending');
  const [children, setChildren] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const sliderWidth = (width - 32 - 4) / 2;
  const slideAnim = React.useRef(new Animated.Value(activeSegment === 'pending' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeSegment === 'pending' ? 0 : 1,
      useNativeDriver: true,
      tension: 110,
      friction: 11,
    }).start();
  }, [activeSegment]);

  const fetchChildren = async () => {
    if (!user?.name) return;
    try {
      const parentQuery = `
        query ParentDashboard($parentName: String!) {
          parentDashboard(parentName: $parentName) {
            children { 
              id name className rollNumber classId
            }
          }
        }
      `;
      const gqlRes = await api.post<any>('/graphql', { query: parentQuery, variables: { parentName: user.name } });
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
      console.error('Failed to fetch parent children:', error);
    }
  };

  const activeChild = children.find(c => c.id === selectedChildId) || children[0];

  const fetchHomeworkAndSubmissions = async () => {
    if (!activeChild?.classId) return;
    try {
      const hwRes = await api.get(`/homework?classId=${activeChild.classId}`);
      setHomeworks(Array.isArray(hwRes) ? hwRes : []);

      try {
        const subRes = await api.get<any>(`/submissions?studentId=${activeChild.id}`);
        setSubmissions(subRes?.data || subRes || []);
      } catch (err) {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch homework or submissions:', error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      await fetchChildren();
      setIsLoading(false);
    };
    initData();
  }, [user?.id]);

  useEffect(() => {
    const loadHw = async () => {
      if (!activeChild?.classId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setActiveSegment('pending');
      const startTime = Date.now();
      await fetchHomeworkAndSubmissions();
      const elapsed = Date.now() - startTime;
      const minDuration = 400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      setIsLoading(false);
    };
    loadHw();
  }, [activeChild]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await fetchChildren();
    await fetchHomeworkAndSubmissions();
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const enrichedHomeworks = useMemo(() => {
    const now = new Date();
    const subMap = new Map();
    submissions.forEach((s: any) => {
      subMap.set(s.assignmentId, s);
    });

    const parseDateSafely = (dateVal: any) => {
      if (!dateVal) return new Date();
      try {
        const dStr = typeof dateVal === 'string' ? dateVal : String(dateVal);
        const formattedStr = dStr.trim().replace(' ', 'T');
        const parsed = new Date(formattedStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
        const parts = dStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (parts) {
          return new Date(parseInt(parts[1], 10), parseInt(parts[2], 10) - 1, parseInt(parts[3], 10));
        }
        return new Date(dStr);
      } catch (e) {
        return new Date();
      }
    };

    return homeworks.map((a: any) => {
      const parsedDue = parseDateSafely(a.dueDate);
      const isSubmitted = subMap.has(a.id);
      const pastDue = parsedDue.getTime() < now.getTime();

      let status = 'pending';
      if (isSubmitted) status = 'completed';
      else if (pastDue) status = 'overdue';

      let displayDate = a.dueDate ? String(a.dueDate) : 'N/A';
      if (a.dueDate) {
        try {
          const dStr = typeof a.dueDate === 'string' ? a.dueDate : String(a.dueDate);
          const sliced = dStr.split('T')[0].split(' ')[0];
          if (sliced && sliced.length >= 8) {
            displayDate = sliced;
          }
        } catch (e) {
          // Keep raw string as fallback
        }
      }

      return {
        id: a.id,
        title: a.title,
        subject: a.subjectName || 'General',
        dueDate: displayDate,
        status,
        content: a.description || 'No description provided.',
      };
    });
  }, [homeworks, submissions]);

  const filteredHomework = enrichedHomeworks.filter(hw => 
    activeSegment === 'pending' ? hw.status !== 'completed' : hw.status === 'completed'
  );

  const isInitialLoading = isLoading && children.length === 0;

  if (isInitialLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#AF52DE']} />}
        >
          {/* ChildSelector Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
            <Skeleton width={90} height={32} borderRadius={16} />
          </View>

          {/* Segment Selector Skeleton */}
          <View style={{ height: 40, borderRadius: 8, backgroundColor: colors.backgroundSelected, marginBottom: 20, flexDirection: 'row', padding: 2, gap: 4 }}>
            <Skeleton style={{ flex: 1 }} height="100%" borderRadius={6} />
            <Skeleton style={{ flex: 1 }} height="100%" borderRadius={6} />
          </View>

          {/* Homework Cards Skeletons (Matching real card style and spacing) */}
          <View style={{ gap: 12 }}>
            {[1, 2].map(i => (
              <View key={i} style={[styles.card, { backgroundColor: colors.backgroundElement, minHeight: 140, justifyContent: 'space-between' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="30%" height={18} borderRadius={6} />
                  </View>
                </View>
                <Skeleton width="95%" height={12} style={{ marginVertical: 12 }} />
                <View style={[styles.footer, { justifyContent: 'flex-start', gap: 8 }]}>
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (!isLoading && children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#AF52DE']} />}
        >
          <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#AF52DE']} />}
      >
        {children.length > 0 && (
          <ChildSelector 
            students={children} 
            selectedStudentId={selectedChildId} 
            onSelect={setSelectedChildId} 
          />
        )}

        <View style={styles.segmentWrapper}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              width: sliderWidth,
              backgroundColor: '#AF52DE',
              borderRadius: 6,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, sliderWidth],
                  }),
                },
                {
                  scaleX: slideAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.25, 1],
                  }),
                },
              ],
            }}
          />
          <TouchableOpacity 
            style={styles.segmentBtn} 
            onPress={() => setActiveSegment('pending')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.segmentText, { color: activeSegment === 'pending' ? '#FFF' : colors.text }]}>Pending</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.segmentBtn} 
            onPress={() => setActiveSegment('completed')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.segmentText, { color: activeSegment === 'completed' ? '#FFF' : colors.text }]}>Completed</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2].map(i => (
              <View key={i} style={[styles.card, { backgroundColor: colors.backgroundElement, minHeight: 140, justifyContent: 'space-between' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="30%" height={18} borderRadius={6} />
                  </View>
                </View>
                <Skeleton width="95%" height={12} style={{ marginVertical: 12 }} />
                <View style={[styles.footer, { justifyContent: 'flex-start', gap: 8 }]}>
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <>
            {filteredHomework.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text" size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
                <ThemedText style={{ color: colors.textSecondary }}>No homework found in this section.</ThemedText>
              </View>
            ) : (
              filteredHomework.map((hw) => (
                <View key={hw.id} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.hwTitle}>{hw.title}</ThemedText>
                      <View style={[styles.subjectTag, { backgroundColor: colors.backgroundSelected }]}>
                        <ThemedText style={styles.subjectText}>{hw.subject}</ThemedText>
                      </View>
                    </View>
                    {hw.status === 'overdue' && (
                      <View style={styles.overdueBadge}>
                        <ThemedText style={styles.overdueText}>OVERDUE</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={[styles.hwContent, { color: colors.textSecondary }]}>{hw.content}</ThemedText>
                  <View style={styles.footer}>
                    <Ionicons name="time-outline" size={14} color={hw.status === 'overdue' ? '#FF3B30' : colors.textSecondary} />
                    <ThemedText style={[styles.dueText, { color: hw.status === 'overdue' ? '#FF3B30' : colors.textSecondary }]}>
                      Due: {hw.dueDate}
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    padding: 2,
    borderRadius: 8,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hwTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#AF52DE',
  },
  overdueBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hwContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  dueText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
