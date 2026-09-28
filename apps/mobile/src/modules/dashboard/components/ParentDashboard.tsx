import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SubscriptionPromoModal } from '@/modules/tenancy/components/ParentSubscriptionPromoModal';
import { RecentNotices } from '@/modules/dashboard/components/RecentNotices';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { ChangePasswordModal } from '@/modules/auth/components/ChangePasswordModal';
import { Skeleton } from '@/components/Skeleton';
import type { AppUser, ParentDashboardData, ChildInfo, FeeRecord, ThemeColors, NativeScrollEvent, Notice } from '@/types/index';

interface ChildCardProps {
  child: ChildInfo;
  isSelected: boolean;
  isDark: boolean;
  colors: ThemeColors;
  cardWidth: number;
  onPress: () => void;
}

function ChildCard({ child, isSelected, isDark, colors, cardWidth, onPress }: ChildCardProps) {
  const activeAnim = useMemo(() => new Animated.Value(isSelected ? 1 : 0), []);

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const textColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text, '#FFFFFF'],
  });

  const secondaryTextColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, isDark ? '#8F97A6' : 'rgba(255,255,255,0.7)'],
  });

  const borderColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? '#2E313D' : '#E5E7EB', 'transparent'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ 
        width: cardWidth,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E212C' : '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: isSelected ? 0.08 : 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: activeAnim,
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#202636', '#141824'] : ['#007AFF', '#0056B3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.childScrollCard,
          {
            borderWidth: 1.5,
            borderColor: borderColor,
          }
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Animated.Text style={[styles.wardLabel, { color: secondaryTextColor }]}>
              STUDENT PROFILE
            </Animated.Text>
            <Animated.Text style={[styles.wardName, { color: textColor }]} numberOfLines={1}>
              {child.name}
            </Animated.Text>
          </View>
          {child.avatar ? (
            <Image 
              source={{ uri: child.avatar }} 
              style={[
                styles.childAvatarImg,
                { borderColor: isSelected ? (isDark ? '#3B82F6' : '#FFFFFF') : '#007AFF' }
              ]}
            />
          ) : (
            <LinearGradient
              colors={isSelected ? (isDark ? ['#3B82F6', '#1D4ED8'] : ['#FFFFFF', '#E0E1E6']) : ['#007AFF', '#0056B3']}
              style={styles.childAvatarFallback}
            >
              <Ionicons name="person" size={22} color={isSelected && !isDark ? '#007AFF' : '#FFFFFF'} />
            </LinearGradient>
          )}
        </View>

        <View style={[styles.cardDivider, { 
          backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : isDark ? '#2E313D' : '#E5E7EB' 
        }]} />

        <View style={styles.cardBottomRow}>
          <View style={styles.cardCol}>
            <Animated.Text style={[styles.cardColLabel, { color: secondaryTextColor }]}>
              Class & Section
            </Animated.Text>
            <Animated.Text style={[styles.cardColVal, { color: textColor }]}>
              {child.className || 'Class N/A'}
            </Animated.Text>
          </View>
          <View style={styles.cardCol}>
            <Animated.Text style={[styles.cardColLabel, { color: secondaryTextColor }]}>
              Roll Number
            </Animated.Text>
            <Animated.Text style={[styles.cardColVal, { color: textColor }]}>
              {child.rollNumber || 'N/A'}
            </Animated.Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface ParentDashboardProps {
  user: AppUser;
  data: ParentDashboardData | null;
  refreshing: boolean;
  onRefresh: () => void;
  onChildSwitch?: () => void;
}

export function ParentDashboard({ user, data, refreshing, onRefresh, onChildSwitch }: ParentDashboardProps) {
  const { activeTheme, selectedChildId, setSelectedChildId } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';
  const router = useRouter();
  const { width } = useWindowDimensions();

  const children: ChildInfo[] = useMemo(() => data?.children || [], [data?.children]);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [isChangingChild, setIsChangingChild] = useState(false);
  const [promoModalVisible, setPromoModalVisible] = useState(false);

  const childSwitchMounted = useRef(false);

  useEffect(() => {
    if (!childSwitchMounted.current) {
      childSwitchMounted.current = true;
      return;
    }
    if (selectedChildId) {
      onChildSwitch?.();
    }
  }, [selectedChildId]);

  useEffect(() => {
    // Show premium upgrade popup every time the app opens / dashboard mounts if basic
    const isBasic = !data?.subscriptionPlan || data.subscriptionPlan.toLowerCase() === 'basic';
    if (isBasic && children.length > 0) {
      const timer = setTimeout(() => {
        setPromoModalVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [data?.subscriptionPlan, children.length > 0]);
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const activeChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) || children[0],
    [children, selectedChildId]
  );
  const activeChildIndex = useMemo(
    () => children.findIndex((c) => c.id === activeChild?.id),
    [children, activeChild]
  );
  const cardWidth = width - 32;

  useEffect(() => {
    if (activeChild?.classId && activeChild?.id) {
      let active = true;
      setIsChangingChild(true);
      
      Promise.all([
        api.get<any>(`/homework?classId=${activeChild.classId}`),
        api.get<any>(`/submissions?studentId=${activeChild.id}`).catch(() => [])
      ]).then(([hwRes, subRes]) => {
        if (!active) return;
        
        const homeworkList = Array.isArray(hwRes) ? hwRes : [];
        const submissionListRaw = subRes?.data || subRes || [];
        const submissionList = Array.isArray(submissionListRaw) ? submissionListRaw : [];
        const subMap = new Set(submissionList.map((s: { assignmentId: string }) => s.assignmentId));
        
        // Only count homeworks that have not been submitted/completed
        const pendingCount = homeworkList.filter((a: { id: string }) => !subMap.has(a.id)).length;
        setPendingHomeworkCount(pendingCount);
        
        setTimeout(() => {
          if (active) setIsChangingChild(false);
        }, 350);
      }).catch((err) => {
        console.error('Failed to fetch homework count:', err);
        if (active) setIsChangingChild(false);
      });
      return () => {
        active = false;
      };
    } else {
      setPendingHomeworkCount(0);
      setIsChangingChild(false);
    }
  }, [activeChild]);

  const isInitialMount = useRef(true);
  const isUserScrolling = useRef(false);

  // Sync scroll offset when selectedChildId changes externally
  useEffect(() => {
    if (children.length > 0 && selectedChildId) {
      const idx = children.findIndex((c) => c.id === selectedChildId);
      if (idx !== -1 && !isUserScrolling.current && scrollRef.current) {
        const shouldAnimate = !isInitialMount.current;
        scrollRef.current.scrollTo({ x: idx * (cardWidth + 12), animated: shouldAnimate });
      }
      isInitialMount.current = false;
    }
  }, [selectedChildId, cardWidth, children]);

  const handleScroll = useCallback((event: NativeScrollEvent) => {
    if (!isUserScrolling.current) return;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 12));
    if (index >= 0 && index < children.length) {
      const child = children[index];
      if (child && child.id !== selectedChildId) {
        setSelectedChildId(child.id);
      }
    }
  }, [cardWidth, children, selectedChildId]);

  // Compute stats based on active child — memoized so they only recompute when relevant data changes
  const perf = useMemo(
    () => data?.performanceSummary?.find((p) => p.name === activeChild?.name),
    [data?.performanceSummary, activeChild?.name]
  );
  const attendancePct = useMemo(
    () => perf?.attendanceRate !== undefined ? `${perf.attendanceRate}%` : 'N/A',
    [perf]
  );
  const latestGrade = useMemo(
    () => activeChild?.grades?.[0]?.grade || perf?.grade || 'N/A',
    [activeChild, perf]
  );

  // Compute outstanding fees — memoized so it only recomputes when fees or activeChild changes
  const outstandingFees = useMemo(() => {
      const childFees: FeeRecord[] = (data?.fees || []).filter((f: FeeRecord) => f.studentName === activeChild?.name);
      return childFees
        .filter((f) => f.status !== 'paid')
        .reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);
  }, [data?.fees, activeChild?.name]);

  const parentStats = useMemo(() => [
    { label: 'Attendance', value: attendancePct, icon: 'checkmark-circle', color: '#34C759', route: '/(parent)/(tabs)/attendance' },
{ label: 'Unpaid Fees', value: `₹${outstandingFees}`, icon: 'wallet', color: '#FF3B30', route: '/(parent)/(tabs)/fees' },
    { label: 'Latest Grade', value: latestGrade, icon: 'ribbon', color: '#FF2D55', route: '/(parent)/(tabs)/grades' },
    { label: 'Homework', value: `${pendingHomeworkCount} Pending`, icon: 'document-text', color: '#AF52DE', route: '/(parent)/(tabs)/homework' },
  ], [attendancePct, outstandingFees, latestGrade, pendingHomeworkCount]);

  const noticesList = useMemo(() => (data?.notices || []).map((n: Notice) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    author: n.authorName || 'School Admin',
    priority: n.priority || 'normal',
    date: n.createdAt ? n.createdAt.split('T')[0] : '',
  })), [data?.notices]);

  if (children.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {/* Sleek, Premium Theme Header */}
        <View style={[styles.headerContainer, { 
          backgroundColor: colors.background,
          borderBottomColor: isDark ? '#1F222B' : '#E5E7EB'
        }]}>
          <TouchableOpacity 
            style={styles.headerLeft}
            activeOpacity={0.7}
            onPress={() => router.push('/(parent)/(tabs)/profile')}
          >
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarBg}
            >
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.nameContainer}>
              <ThemedText style={[styles.userNameText, { color: colors.text }]}>
                {user?.name || 'Parent'}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
          }
        >
          <View style={{ alignItems: 'center', padding: 24, gap: 16 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? '#222530' : '#F2F3F7', justifyContent: 'center', alignItems: 'center' }}>
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

  const promoBgColors = isDark ? (['#0F2042', '#061024'] as const) : (['#FFFFFF', '#F2F6FF'] as const);
  const promoBorderColor = isDark ? '#4F7DF9' : '#3B82F6';
  const promoTitleColor = isDark ? '#FFFFFF' : '#0F2042';
  const promoTagBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 32, 66, 0.04)';
  const promoTagTextColor = isDark ? '#E2E8F0' : '#334155';
  const promoSubtextColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 32, 66, 0.5)';
  const promoCtaColor = isDark ? '#82F3FF' : '#2563EB';
  const promoCheckColor = isDark ? '#82F3FF' : '#3B82F6';
  const promoDividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 32, 66, 0.08)';

  return (
    <ThemedView style={styles.container}>
      {/* Sleek, Premium Theme Header */}
      <View style={[styles.headerContainer, { 
        backgroundColor: colors.background,
        borderBottomColor: isDark ? '#1F222B' : '#E5E7EB'
      }]}>
        <TouchableOpacity 
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => router.push('/(parent)/(tabs)/profile')}
        >
          <LinearGradient
            colors={['#FF9500', '#FF5E3A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBg}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.nameContainer}>
            <ThemedText style={[styles.userNameText, { color: colors.text }]}>
              {user?.name || 'Parent'}
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bellBtn, { backgroundColor: isDark ? '#222530' : '#F2F3F7' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
      >
        <ThemedText style={styles.sectionTitle}>My Children</ThemedText>

        {/* Wards Horizontal Scroll List */}
        {children.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <ScrollView 
              ref={scrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.childrenScrollContent}
              snapToInterval={cardWidth + 12}
              decelerationRate="fast"
              disableIntervalMomentum={true}
              snapToAlignment="start"
              onScrollBeginDrag={() => {
                isUserScrolling.current = true;
              }}
              onScrollEndDrag={(event) => {
                handleScroll(event);
                if (event.nativeEvent.velocity?.x === 0) {
                  isUserScrolling.current = false;
                }
              }}
              onMomentumScrollEnd={(event) => {
                handleScroll(event);
                isUserScrolling.current = false;
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {children.map((child: ChildInfo) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  isSelected={child.id === activeChild?.id}
                  isDark={isDark}
                  colors={colors}
                  cardWidth={cardWidth}
                  onPress={() => setSelectedChildId(child.id)}
                />
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {children.length > 1 && (
              <View style={styles.paginationDotsContainer}>
                {children.map((_: ChildInfo, idx: number) => {
                  const isActive = idx === activeChildIndex;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.paginationDot,
                        {
                          backgroundColor: isActive ? '#007AFF' : isDark ? '#3E4253' : '#D1D5DB',
                          width: isActive ? 16 : 6,
                        }
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <ThemedText style={{ color: colors.textSecondary, marginBottom: 16 }}>No children linked to this account.</ThemedText>
        )}

        {/* Premium Subscription Promotional Banner */}
        {(!data?.subscriptionPlan || data.subscriptionPlan.toLowerCase() === 'basic') && (
          <TouchableOpacity
            onPress={() => router.push('/(parent)/subscription' as any)}
            activeOpacity={0.9}
            style={[styles.premiumBannerWrapper, { shadowColor: promoBorderColor }]}
          >
            <LinearGradient
              colors={promoBgColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.premiumBannerGradient, { borderWidth: 1.5, borderColor: promoBorderColor, borderRadius: 20 }]}
            >
              <View style={{ flex: 1 }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <LinearGradient
                      colors={['#4F7DF9', '#82F3FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Ionicons name="sparkles" size={14} color="#0F2042" />
                    </LinearGradient>
                    <ThemedText style={{ color: promoTitleColor, fontSize: 15, fontWeight: '800' }}>Unlock Premium Portal</ThemedText>
                  </View>
                  <View style={{ backgroundColor: promoBorderColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <ThemedText style={{ color: isDark ? '#0F2042' : '#FFFFFF', fontSize: 9, fontWeight: '900' }}>PRO FEATURES</ThemedText>
                  </View>
                </View>

                {/* Bullets grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: promoTagBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={13} color={promoCheckColor} />
                    <ThemedText style={{ color: promoTagTextColor, fontSize: 11, fontWeight: '500' }}>AI Performance Insights</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: promoTagBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={13} color={promoCheckColor} />
                    <ThemedText style={{ color: promoTagTextColor, fontSize: 11, fontWeight: '500' }}>Parent-Teacher Chat</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: promoTagBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={13} color={promoCheckColor} />
                    <ThemedText style={{ color: promoTagTextColor, fontSize: 11, fontWeight: '500' }}>Download & Print Receipts</ThemedText>
                  </View>
                </View>

                {/* Bottom CTA bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: promoDividerColor, paddingTop: 10 }}>
                  <ThemedText style={{ color: promoSubtextColor, fontSize: 11 }}>Get instant parent access</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ThemedText style={{ color: promoCtaColor, fontSize: 13, fontWeight: '700' }}>Upgrade Now</ThemedText>
                    <Ionicons name="arrow-forward" size={14} color={promoCtaColor} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.statsGrid}>
          {parentStats.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.statCard, { 
                backgroundColor: isDark ? '#1E212C' : '#FFFFFF',
                borderColor: isDark ? '#2E313D' : '#E5E7EB',
              }]}
              activeOpacity={0.8}
              onPress={() => item.route && router.push(item.route as any)}
            >
              {isChangingChild ? (
                <View>
                  <View style={styles.statIconRow}>
                    <Skeleton width={36} height={36} borderRadius={10} />
                    <Ionicons name="chevron-forward-outline" size={13} color={colors.textSecondary} />
                  </View>
                  <Skeleton width="60%" height={12} style={{ marginTop: 12, marginBottom: 8 }} />
                  <Skeleton width="45%" height={18} />
                </View>
              ) : (
                <>
                  <View style={styles.statIconRow}>
                    <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Ionicons name="chevron-forward-outline" size={13} color={colors.textSecondary} />
                  </View>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</ThemedText>
                  <ThemedText style={[styles.statNumber, { color: colors.text }]}>{item.value}</ThemedText>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions Row */}
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1E212C' : '#FFFFFF', borderColor: isDark ? '#2E313D' : '#E5E7EB' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(parent)/(tabs)/timetable')}
          >
            {isChangingChild ? (
              <>
                <Skeleton width={38} height={38} borderRadius={12} />
                <Skeleton width="65%" height={11} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <View style={[styles.actionIconWrapper, { backgroundColor: '#5856D615' }]}>
                  <Ionicons name="calendar-number" size={18} color="#5856D6" />
                </View>
                <ThemedText style={styles.actionButtonText}>Timetable</ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1E212C' : '#FFFFFF', borderColor: isDark ? '#2E313D' : '#E5E7EB' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(parent)/(tabs)/tickets')}
          >
            {isChangingChild ? (
              <>
                <Skeleton width={38} height={38} borderRadius={12} />
                <Skeleton width="65%" height={11} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <View style={[styles.actionIconWrapper, { backgroundColor: '#007AFF15' }]}>
                  <Ionicons name="ticket" size={18} color="#007AFF" />
                </View>
                <ThemedText style={styles.actionButtonText}>Support</ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#1E212C' : '#FFFFFF', borderColor: isDark ? '#2E313D' : '#E5E7EB' }]}
            activeOpacity={0.8}
            onPress={() => setChangePasswordVisible(true)}
          >
            {isChangingChild ? (
              <>
                <Skeleton width={38} height={38} borderRadius={12} />
                <Skeleton width="65%" height={11} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <View style={[styles.actionIconWrapper, { backgroundColor: '#FF950015' }]}>
                  <Ionicons name="key" size={18} color="#FF9500" />
                </View>
                <ThemedText style={styles.actionButtonText}>Password</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        <RecentNotices data={noticesList} />

        <View style={{ height: 30 }} />
      </ScrollView>

      <ChangePasswordModal 
        visible={changePasswordVisible}
        onDismiss={() => setChangePasswordVisible(false)}
      />

      <SubscriptionPromoModal
        visible={promoModalVisible}
        onClose={() => setPromoModalVisible(false)}
        onUpgrade={() => {
          setPromoModalVisible(false);
          router.push('/(parent)/subscription' as any);
        }}
        isDark={isDark}
        colors={colors}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  nameContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.6,
    marginBottom: 12,
  },
  childrenScrollContent: {
    paddingBottom: 8,
    gap: 12,
  },
  childScrollCard: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradCapBorder: {
    padding: 3,
    borderWidth: 1.5,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradCapBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  wardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    gap: 6,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCol: {
    flex: 1,
  },
  cardColLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardColVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  childAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
  },
  childAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actionIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  premiumBannerWrapper: {
    marginHorizontal: 0,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F7DF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  premiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  crownIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBannerTitle: {
    color: '#0F2042',
    fontSize: 16,
    fontWeight: '800',
  },
  premiumBannerDesc: {
    color: 'rgba(15, 32, 66, 0.85)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

