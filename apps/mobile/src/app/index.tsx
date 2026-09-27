import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, setGlobalDashboardCache, globalDashboardCache } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { api, withRetry } from '@/lib/api';

// Import individual onboarding slides
import WelcomeSlide from '@/components/onboarding/WelcomeSlide';
import ParentSlide from '@/components/onboarding/ParentSlide';
import TeacherSlide from '@/components/onboarding/TeacherSlide';
import AdminSlide from '@/components/onboarding/AdminSlide';
import CustomSplashScreen from '@/components/ui/CustomSplashScreen';
import NetInfo from '@react-native-community/netinfo';
import { OfflineState } from '@/components/OfflineState';

const ONBOARDING_KEY = '@onboarding_complete';

type AppState = 'loading' | 'onboarding' | 'redirect' | 'done';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const [appState, setAppState] = useState<AppState>('loading');
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  // Keep a ref to always have the latest user, so splash finish callback is never stale
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isChecking, setIsChecking] = useState(false);

  // Monitor network connection state on launch
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isInternetReachable ?? state.isConnected;
      setIsConnected(online);
    });
    return () => unsubscribe();
  }, []);

  // Step 1: On mount, check both auth + onboarding flag together
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const startTime = Date.now();

      // Wait for auth context to finish loading its session or if we already redirected
      if (authLoading || appState === 'done' || cancelled) return;

      let nextState: AppState = 'onboarding';
      let shouldRedirectToLogin = false;

      // If already logged in → go to dashboard immediately
      if (user) {
        nextState = 'redirect';
      } else {
        // No active session → check if onboarding was already seen
        try {
          const done = await AsyncStorage.getItem(ONBOARDING_KEY);
          if (cancelled) return;
          if (done === 'true') {
            shouldRedirectToLogin = true;
          }
        } catch (err) {
          console.warn('Failed to read onboarding flag from AsyncStorage', err);
        }
      }

      if (cancelled) return;

      if (shouldRedirectToLogin) {
        setAppState('done');
        router.replace('/login');
      } else {
        setAppState(nextState);
      }
    }
    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);  const [prefetchDone, setPrefetchDone] = useState(!!globalDashboardCache);

  // Prefetch dashboard data in the background during splash screen
  useEffect(() => {
    if (appState !== 'redirect' || !user) return;
    
    const currentUser = user;
    async function prefetchDashboard() {
      try {
        if (globalDashboardCache) {
          setPrefetchDone(true);
          return;
        }

        if (currentUser.role === 'parent') {
          const parentQuery = `
            query ParentDashboard($parentName: String!) {
              parentDashboard(parentName: $parentName) {
                children { 
                  id userId name email className classId rollNumber gender dateOfBirth admissionDate
                  grades { id studentId studentName subjectName examType marks maxMarks grade createdAt }
                  attendance { id studentId studentName className date status remarks }
                }
                notices { id title content authorName priority createdAt targetRole }
                fees { id studentName type amount status dueDate paidAmount }
                performanceSummary { name attendanceRate avgGrade grade }
                subscriptionPlan
              }
            }
          `;
          const gqlRes = await withRetry(
            () => api.post<any>('/graphql', { query: parentQuery, variables: { parentName: currentUser.name } }),
            4, 1500
          );
          if (gqlRes.data?.parentDashboard) {
            setGlobalDashboardCache(gqlRes.data.parentDashboard);
          }
        } else {
          const res = await withRetry(() => api.get<any>('/dashboard'), 4, 1500);
          if (res) {
            const mapped = {
              totalStudents: res.totalStudents || 0,
              totalTeachers: res.totalTeachers || 0,
              totalParents: res.totalParents || 0,
              totalClasses: res.totalClasses || 0,
              totalStaff: res.totalStaff || 0,
              totalRevenue: res.totalRevenue || 0,
              attendanceRate: res.attendanceRate || 0,
              upcomingEvents: res.upcomingEvents || 0,
              monthlyAttendance: res.monthlyAttendance || [],
              classDistribution: res.classDistribution || [],
              feeByType: res.feeByType || [],
              monthlyRevenue: res.monthlyRevenue || [],
              maleStudents: res.maleStudents || 0,
              femaleStudents: res.femaleStudents || 0,
              recentNotices: (res.recentNotices || []).map((notice: any) => ({
                id: notice.id,
                title: notice.title,
                content: notice.content,
                date: notice.createdAt ? notice.createdAt.slice(0, 10) : '',
              })),
            };
            setGlobalDashboardCache(mapped);
          }
        }
      } catch (err) {
        console.warn('Dashboard background prefetch failed:', err);
      } finally {
        setPrefetchDone(true);
      }
    }
    prefetchDashboard();
  }, [appState, user]);

  const handleSplashFinished = () => {
    const currentUser = userRef.current;
    if (!currentUser?.role) {
      setAppState('done');
      router.replace('/login');
      return;
    }
    setAppState('done');
    if (currentUser.role === 'super_admin') {
      router.replace('/(superadmin)/(tabs)/web-version');
    } else if (currentUser.role === 'admin') {
      router.replace('/(admin)/(tabs)/dashboard');
    } else if (currentUser.role === 'teacher') {
      router.replace('/(teacher)/(tabs)/dashboard');
    } else if (currentUser.role === 'parent') {
      router.replace('/(parent)/(tabs)/dashboard');
    } else if (currentUser.role === 'staff') {
      router.replace('/(staff)/(tabs)/dashboard');
    } else {
      router.replace('/(student)/(tabs)/dashboard');
    }
  };

  // Mark onboarding done and navigate to login
  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (err) {
      console.warn('Failed to set onboarding flag in AsyncStorage', err);
    }
    setAppState('done');
    router.replace('/login');
  };

  const scrollToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      scrollToSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      scrollToSlide(currentSlide - 1);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    if (index !== currentSlide && index >= 0 && index <= 3) {
      setCurrentSlide(index);
    }
  };

  if (appState === 'done') {
    return null;
  }

  // ── LOADING SCREEN ──────────────────────────────────────────────
  if (appState === 'loading' || appState === 'redirect') {
    if (isConnected === false) {
      return (
        <OfflineState
          onRetry={async () => {
            setIsChecking(true);
            try {
              const state = await NetInfo.refresh();
              setIsConnected(state.isConnected);
            } catch (err) {
              console.warn('Network refresh failed:', err);
            } finally {
              setIsChecking(false);
            }
          }}
          isRetrying={isChecking}
        />
      );
    }
    if (user) {
      return (
        <CustomSplashScreen
          tenantLogo={user.tenantLogo}
          tenantName={user.tenantName}
          onFinish={handleSplashFinished}
          isPrefetchDone={prefetchDone}
        />
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF2D55" />
      </View>
    );
  }

  // Define accent colors for each slide
  const slideAccents = ['#007AFF', '#00A86B', '#5E5CE6', '#007AFF'];
  const activeAccent = slideAccents[currentSlide];

  const onboardingColors = Colors.light;

  // ── ONBOARDING SLIDES ───────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: onboardingColors.background }]} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        {currentSlide > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn} activeOpacity={0.7}>
            <View style={styles.backButtonContainer}>
              <Ionicons name="chevron-back" size={24} color={onboardingColors.text} />
              <ThemedText style={[styles.backText, { color: onboardingColors.text }]}>Back</ThemedText>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconPlaceholder} />
        )}

        {currentSlide === 0 && (
          <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
            <ThemedText style={[styles.skipText, { color: '#007AFF' }]}>Skip</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Paging ScrollView for Finger Sliding */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.horizontalScroll}
        contentContainerStyle={{ width: width * 4 }}
      >
        <View style={{ width, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <WelcomeSlide colors={onboardingColors} />
          </ScrollView>
        </View>
        
        <View style={{ width, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ParentSlide colors={onboardingColors} />
          </ScrollView>
        </View>
        
        <View style={{ width, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TeacherSlide colors={onboardingColors} />
          </ScrollView>
        </View>
        
        <View style={{ width, flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AdminSlide colors={onboardingColors} />
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footerContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentSlide ? activeAccent : onboardingColors.backgroundSelected,
                  width: idx === currentSlide ? 16 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: activeAccent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.ctaBtnText}>
            {currentSlide === 3 ? 'Get Started' : 'Next'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 13,
  },
  container: {
    flex: 1,
  },
  headerBar: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIconBtn: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerIconPlaceholder: {
    width: 32,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  horizontalScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
