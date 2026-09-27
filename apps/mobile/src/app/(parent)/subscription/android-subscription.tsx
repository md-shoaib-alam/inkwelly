import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, useWindowDimensions, Image, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface AndroidSubscriptionProps {
  parentId: string;
  onSuccess: () => void;
  activePlanId?: string;
  autoRenew?: boolean;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export default function AndroidSubscription({ 
  parentId, 
  onSuccess, 
  activePlanId = 'basic',
  autoRenew = true,
  headerComponent,
  footerComponent,
  onOpenPrivacy,
  onOpenTerms
}: AndroidSubscriptionProps) {
  const router = useRouter();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const cardBg = activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : colors.backgroundElement;
  const cardBorder = activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : colors.backgroundSelected;
  const { width } = useWindowDimensions();
  const isLargeDevice = width > 600;
  const insets = useSafeAreaInsets();
  // Sticky bar total height: paddingVertical(12*2) + button(14*2 + fontSize) + bottom inset
  const STICKY_BAR_HEIGHT = 12 + 12 + 14 + 14 + 20 + insets.bottom;

  const [selectedPlanId, setSelectedPlanId] = useState<'standard' | 'premium'>(
    activePlanId === 'premium' ? 'premium' : 'standard'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [purchasedPlanName, setPurchasedPlanName] = useState('');

  const scrollX = useRef(new Animated.Value(activePlanId === 'premium' ? width : 0)).current;
  const horizontalScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activePlanId === 'premium') {
      setTimeout(() => {
        horizontalScrollRef.current?.scrollTo({ x: width, animated: false });
      }, 50);
    }
  }, [activePlanId, width]);

  const handleTabPress = (planId: 'standard' | 'premium') => {
    setSelectedPlanId(planId);
    horizontalScrollRef.current?.scrollTo({
      x: planId === 'premium' ? width : 0,
      animated: true,
    });
  };

  const PLANS = [
    {
      id: 'standard',
      name: 'Standard Plan',
      pricing: {
        monthly: 19,
        quarterly: 49,
        yearly: 149,
      },
      icon: 'star-outline',
      color: '#FF9500',
      features: [
        { text: 'Everything in Basic', included: true },
        { text: 'Detailed attendance trends', included: true },
        { text: 'Online fee payment access', included: true },
        { text: 'Detailed performance analytics', included: true },
        { text: 'Real-time notifications', included: true },
      ],
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      pricing: {
        monthly: 49,
        quarterly: 129,
        yearly: 399,
      },
      icon: 'ribbon-outline',
      color: '#8B5CF6',
      features: [
        { text: 'Everything in Standard', included: true },
        { text: 'AI performance insights', included: true },
        { text: 'Direct parent-teacher chat', included: true },
        { text: 'Instant push notifications', included: true },
        { text: 'Monthly progress reports (PDF)', included: true },
      ],
    },
  ];

  const activePlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
  const currentPrice = activePlan.pricing[billingCycle];

  const cycles = [
    { id: 'monthly', title: '1', subtitle: 'Month', save: null },
    {
      id: 'quarterly',
      title: '3',
      subtitle: 'Months',
      save: selectedPlanId === 'standard' ? 'Save 12%' : 'Save 9%',
      popular: true,
    },
    {
      id: 'yearly',
      title: '1',
      subtitle: 'Year',
      save: selectedPlanId === 'standard' ? 'Save 25%' : 'Save 28%',
    },
  ];

  const handleSubscribe = async (planId: string, planName: string, amount: number) => {
    setLoadingPlan(planId);
    try {
      const response = await api.post('/subscriptions', {
        action: 'purchase',
        parentId,
        planId,
        planName,
        amount,
        period: billingCycle,
        paymentMethod: 'google_play',
        addons: [],
      }) as any;

      if (response && response.success) {
        setPurchasedPlanName(planName);
        setSuccessModalVisible(true);
      } else {
        Alert.alert('Subscription Failed', response.error || 'Failed to complete subscription');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during payment verification');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const response = await api.get('/subscriptions') as any;
      if (response && response.activeSubscription) {
        Alert.alert(
          'Restore Successful',
          `Your ${response.activeSubscription.planName} has been successfully restored.`
        );
      } else {
        Alert.alert(
          'Restore Purchase',
          'No active platform subscriptions were found for this account.'
        );
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'An error occurred while restoring purchases.');
    }
  };

  const renderSharedPolicies = () => (
    <View style={{ marginTop: 8 }}>
      {/* Standard Terms & Disclosures */}
      <View
        style={[
          styles.disclosureBox,
          { backgroundColor: cardBg, borderColor: cardBorder }
        ]}
      >
        <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" style={{ marginRight: 6, marginTop: 2 }} />
        <ThemedText style={[styles.disclosureText, { color: colors.textSecondary }]}>
          Google Play Subscription Terms: Billing occurs periodically. Subscriptions automatically renew unless disabled at
          least 24-hours prior to renewal. Manage or cancel via device settings.
        </ThemedText>
      </View>

      {/* Subscription & Privacy Policy Card */}
      <View style={[styles.policyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.policyHeader}>
          <Ionicons name="document-text-outline" size={20} color="#007AFF" style={{ marginRight: 8 }} />
          <ThemedText style={styles.policyTitle} type="defaultSemiBold">Subscription & Privacy Policy</ThemedText>
        </View>
        <ThemedText style={[styles.policyBody, { color: colors.textSecondary }]}>
          All parent B2C subscriptions are subject to automatic renewal charges via your respective platform billing accounts (Google Play Store or App Store).
        </ThemedText>
        <ThemedText style={[styles.policyBody, { color: colors.textSecondary, marginTop: 8 }]}>
          - Subscriptions automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period.
        </ThemedText>
        <ThemedText style={[styles.policyBody, { color: colors.textSecondary, marginTop: 4 }]}>
          - You can manage subscriptions and turn off auto-renewal by going to your Account Settings on your device after purchase.
        </ThemedText>
        <View style={styles.linkRow}>
          <TouchableOpacity onPress={onOpenPrivacy}>
            <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
          </TouchableOpacity>
          <ThemedText style={{ color: colors.textSecondary, marginHorizontal: 8 }}>|</ThemedText>
          <TouchableOpacity onPress={onOpenTerms}>
            <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
          </TouchableOpacity>
          <ThemedText style={{ color: colors.textSecondary, marginHorizontal: 8 }}>|</ThemedText>
          <TouchableOpacity onPress={handleRestorePurchases}>
            <ThemedText style={styles.linkText}>Restore Purchases</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: STICKY_BAR_HEIGHT + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {headerComponent && (
          <View style={styles.paddingContainer}>
            {headerComponent}
          </View>
        )}
        {/* Plan Tabs */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.backgroundSelected }]}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabPress('standard')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                selectedPlanId === 'standard'
                  ? { color: '#3B82F6', fontWeight: '700' }
                  : { color: colors.textSecondary },
              ]}
            >
              Standard
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handleTabPress('premium')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                selectedPlanId === 'premium'
                  ? { color: '#8B5CF6', fontWeight: '700' }
                  : { color: colors.textSecondary },
              ]}
            >
              Premium
            </ThemedText>
          </TouchableOpacity>

          {/* Sliding Indicator */}
          <Animated.View
            style={[
              styles.tabIndicatorContainer,
              {
                width: '50%',
                transform: [
                  {
                    translateX: scrollX.interpolate({
                      inputRange: [0, width],
                      outputRange: [0, width / 2],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Blue Indicator (Standard) */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  backgroundColor: '#3B82F6',
                  opacity: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
            {/* Purple Indicator (Premium) */}
            <Animated.View
              style={[
                styles.tabIndicator,
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#8B5CF6',
                  opacity: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Sliding Pager Content (Finger swipeable ScrollView) */}
        <Animated.ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setSelectedPlanId(index === 1 ? 'premium' : 'standard');
          }}
          contentContainerStyle={{ width: width * 2 }}
        >
          {/* Standard Page */}
          <View style={[styles.page, { width }]}>
            <Image
              source={require('@/assets/images/paywall_standard.png')}
              style={[styles.bannerImage, isLargeDevice && { height: 180 }]}
              resizeMode="cover"
            />

            {/* Options Cards Row */}
            <View style={styles.optionsRow}>
              {cycles.map((item) => {
                const isSelected = billingCycle === item.id;
                const price = PLANS[0].pricing[item.id as 'monthly' | 'quarterly' | 'yearly'];
                const CardBg = isSelected ? LinearGradient : View;
                const cardProps = isSelected
                  ? {
                    colors: ['#3B82F6', '#2563EB'],
                    start: { x: 0, y: 0 },
                    end: { x: 1, y: 1 },
                    style: [styles.optionCard, { borderColor: 'transparent' }, item.popular && styles.popularCardPadding],
                    }
                  : {
                      style: [
                        styles.optionCard,
                        { backgroundColor: cardBg, borderColor: cardBorder },
                        item.popular && styles.popularCardPadding,
                      ],
                    };

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={{ flex: 1 }}
                    onPress={() => setBillingCycle(item.id as any)}
                    activeOpacity={0.9}
                  >
                    {/* @ts-ignore */}
                    <CardBg {...cardProps}>
                      {item.popular && (
                        <View style={styles.optionPopularBadgeContainer}>
                           <View style={[styles.optionPopularBadge, { backgroundColor: isSelected ? '#FFF' : '#3B82F6' }]}>
                            <ThemedText numberOfLines={1} style={[styles.optionPopularText, { color: isSelected ? '#3B82F6' : '#FFF' }]}>
                              Popular
                            </ThemedText>
                          </View>
                        </View>
                      )}
                      <ThemedText style={[styles.optionNum, isSelected && styles.whiteText]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={[styles.optionPeriod, isSelected ? styles.whiteText : { color: colors.textSecondary }]}>
                        {item.subtitle}
                      </ThemedText>
                      <ThemedText style={[styles.optionPrice, isSelected && styles.whiteText]}>
                        ₹{price}
                      </ThemedText>
                      {item.save && (
                        <View style={[styles.saveBadge, isSelected ? { backgroundColor: 'rgba(0, 0, 0, 0.35)' } : { backgroundColor: '#30D158' }]}>
                          <ThemedText style={[styles.optionSaveText, { color: '#FFF' }]}>
                            Save 12%
                          </ThemedText>
                        </View>
                      )}
                    </CardBg>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={styles.sectionTitle} type="defaultSemiBold">
              Included Features
            </ThemedText>

            <View style={[styles.featuresSection, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
              {PLANS[0].features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
                  </View>
                  <ThemedText style={[styles.featureRowText, { color: colors.text }]}>
                    {feature.text}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Render Disclosures & Policy Card (Slides with Standard Page) */}
            {renderSharedPolicies()}
          </View>

          {/* Premium Page */}
          <View style={[styles.page, { width }]}>
            <Image
              source={require('@/assets/images/paywall_premium.png')}
              style={[styles.bannerImage, isLargeDevice && { height: 180 }]}
              resizeMode="cover"
            />

            {/* Options Cards Row */}
            <View style={styles.optionsRow}>
              {cycles.map((item) => {
                const isSelected = billingCycle === item.id;
                const price = PLANS[1].pricing[item.id as 'monthly' | 'quarterly' | 'yearly'];
                const CardBg = isSelected ? LinearGradient : View;
                const cardProps = isSelected
                  ? {
                    colors: ['#8B5CF6', '#D946EF'],
                    start: { x: 0, y: 0 },
                    end: { x: 1, y: 1 },
                    style: [styles.optionCard, { borderColor: 'transparent' }, item.popular && styles.popularCardPadding],
                    }
                  : {
                      style: [
                        styles.optionCard,
                        { backgroundColor: cardBg, borderColor: cardBorder },
                        item.popular && styles.popularCardPadding,
                      ],
                    };

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={{ flex: 1 }}
                    onPress={() => setBillingCycle(item.id as any)}
                    activeOpacity={0.9}
                  >
                    {/* @ts-ignore */}
                    <CardBg {...cardProps}>
                      {item.popular && (
                        <View style={styles.optionPopularBadgeContainer}>
                          <View style={[styles.optionPopularBadge, { backgroundColor: isSelected ? '#FFF' : '#8B5CF6' }]}>
                            <ThemedText numberOfLines={1} style={[styles.optionPopularText, { color: isSelected ? '#8B5CF6' : '#FFF' }]}>
                              Popular
                            </ThemedText>
                          </View>
                        </View>
                      )}
                      <ThemedText style={[styles.optionNum, isSelected && styles.whiteText]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={[styles.optionPeriod, isSelected ? styles.whiteText : { color: colors.textSecondary }]}>
                        {item.subtitle}
                      </ThemedText>
                      <ThemedText style={[styles.optionPrice, isSelected && styles.whiteText]}>
                        ₹{price}
                      </ThemedText>
                      {item.save && (
                        <View style={[styles.saveBadge, isSelected ? { backgroundColor: 'rgba(0, 0, 0, 0.35)' } : { backgroundColor: '#30D158' }]}>
                          <ThemedText style={[styles.optionSaveText, { color: '#FFF' }]}>
                            Save 9%
                          </ThemedText>
                        </View>
                      )}
                    </CardBg>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={styles.sectionTitle} type="defaultSemiBold">
              Included Features
            </ThemedText>

            <View style={[styles.featuresSection, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
              {PLANS[1].features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
                  </View>
                  <ThemedText style={[styles.featureRowText, { color: colors.text }]}>
                    {feature.text}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Render Disclosures & Policy Card (Slides with Premium Page) */}
            {renderSharedPolicies()}
          </View>
        </Animated.ScrollView>

        {footerComponent}
      </ScrollView>

      {/* Sticky Bottom Checkout Bar — fixed like a tab bar */}
      <View
        style={[
          styles.stickyBottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.backgroundSelected,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 28,
          },
        ]}
      >
        <View style={{ overflow: 'hidden', width: width - 32 }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              width: (width - 32) * 2,
              transform: [
                {
                  translateX: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [0, -(width - 32)],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }}
          >
            {/* Standard Button View */}
            <View style={{ width: width - 32 }}>
              {activePlanId === 'standard' && autoRenew ? (
                <View style={[styles.bottomButton, { backgroundColor: '#34C75920', borderWidth: 1, borderColor: '#34C75940' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#34C759" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#34C759', fontWeight: '700', fontSize: 16 }}>
                    Current Active Plan
                  </ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSubscribe('standard', PLANS[0].name, PLANS[0].pricing[billingCycle])}
                  disabled={!!loadingPlan}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomButton}
                  >
                    {loadingPlan ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <ThemedText style={styles.bottomButtonText}>
                        Get {PLANS[0].name} for ₹{PLANS[0].pricing[billingCycle]}
                      </ThemedText>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Premium Button View */}
            <View style={{ width: width - 32 }}>
              {activePlanId === 'premium' && autoRenew ? (
                <View style={[styles.bottomButton, { backgroundColor: '#34C75920', borderWidth: 1, borderColor: '#34C75940' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#34C759" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#34C759', fontWeight: '700', fontSize: 16 }}>
                    Current Active Plan
                  </ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSubscribe('premium', PLANS[1].name, PLANS[1].pricing[billingCycle])}
                  disabled={!!loadingPlan}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#D946EF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomButton}
                  >
                    {loadingPlan ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <ThemedText style={styles.bottomButtonText}>
                        Get {PLANS[1].name} for ₹{PLANS[1].pricing[billingCycle]}
                      </ThemedText>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Subscription Success Modal Overlay */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          onSuccess();
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected },
            ]}
          >
            <LinearGradient colors={['#4F7DF9', '#82F3FF']} style={styles.successIconCircle}>
              <Ionicons name="checkmark-sharp" size={32} color="#0F2042" />
            </LinearGradient>

            <ThemedText style={styles.successTitle} type="defaultSemiBold">
              Upgrade Successful!
            </ThemedText>

            <ThemedText style={[styles.successDesc, { color: colors.textSecondary }]}>
              Congratulations! You are now subscribed to the {purchasedPlanName}. Your premium parent portal features are
              unlocked and ready.
            </ThemedText>

            <TouchableOpacity
              style={[styles.successButton, { paddingVertical: 0, overflow: 'hidden' }]}
              onPress={() => {
                setSuccessModalVisible(false);
                onSuccess();
                router.replace('/(parent)/(tabs)/dashboard' as any);
              }}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', paddingVertical: 14, justifyContent: 'center', alignItems: 'center' }}
              >
                <ThemedText style={[styles.successButtonText, { color: '#0F2042', fontWeight: 'bold' }]}>Start Exploring</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 3,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicatorContainer: {
    position: 'absolute',
    bottom: -1,
    height: 3,
  },
  tabIndicator: {
    height: '100%',
    width: '100%',
    borderRadius: 1.5,
  },
  pagerContainer: {
    flexDirection: 'row',
  },
  page: {
    paddingHorizontal: 16,
  },
  paddingContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 14,
    opacity: 0.8,
  },
  bannerImage: {
    height: 120,
    borderRadius: 0,
    marginVertical: 12,
    marginHorizontal: -16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  standardSelectedCard: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  premiumSelectedCard: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  optionPopularBadgeContainer: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  optionPopularBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionPopularText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  popularCardPadding: {
    paddingTop: 24,
  },
  optionNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  optionPeriod: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  optionSaveText: {
    fontSize: 9,
    fontWeight: '900',
  },
  whiteText: {
    color: '#FFF',
  },
  whiteTextOp: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  featuresSection: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureRowText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  bottomButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclosureBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclosureText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  policyCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 10,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  policyTitle: {
    fontSize: 15,
  },
  policyBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
