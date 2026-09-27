import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Platform, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getApiBaseUrl } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AndroidSubscription from './android-subscription';
import IosSubscription from './ios-subscription';

interface SubscriptionRecord {
  id: string;
  planName: string;
  planId: string;
  amount: number;
  period: string;
  status: string;
  paymentMethod: string;
  transactionId: string | null;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
}

const PRIVACY_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; color: #FFFFFF; background-color: #121212; line-height: 1.6; }
    h1 { color: #FF9500; font-size: 22px; margin-bottom: 8px; }
    h2 { color: #FFFFFF; font-size: 16px; margin-top: 20px; }
    p { font-size: 13px; opacity: 0.8; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: June 2026</p>
  <p>We take your privacy seriously. This policy describes how we collect, use, and handle parent and student information in connection with the portal services.</p>
  <h2>1. Information We Collect</h2>
  <p>We collect student name, academic metrics, notices, and payment receipts purely for providing dashboards and notifications to verified parent users.</p>
  <h2>2. How We Use Information</h2>
  <p>Your details are processed to ensure secure payment verification via Google Play / App Store, and display academic records in real time.</p>
  <h2>3. Data Protection</h2>
  <p>All transaction histories and credentials are encrypted during transmission and stored in a secure cloud environment.</p>
</body>
</html>
`;

const TERMS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; color: #FFFFFF; background-color: #121212; line-height: 1.6; }
    h1 { color: #FF9500; font-size: 22px; margin-bottom: 8px; }
    h2 { color: #FFFFFF; font-size: 16px; margin-top: 20px; }
    p { font-size: 13px; opacity: 0.8; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Last updated: June 2026</p>
  <p>By using the Premium Parent Portal services, you agree to these standard terms of service.</p>
  <h2>1. Subscription and Billing</h2>
  <p>Parent subscriptions are auto-renewed cycles billed via your App Store or Play Store account. Cancellations take effect at the end of the current billing cycle.</p>
  <h2>2. Use of Services</h2>
  <p>You agree to utilize the portal only for retrieving academic logs of your own registered student children.</p>
  <h2>3. Service Modifications</h2>
  <p>We reserve the right to upgrade or modify premium tiers, pricing schedules, or features with prior notice.</p>
</body>
</html>
`;

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const cardBg = activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : colors.backgroundElement;
  const cardBorder = activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : colors.backgroundSelected;
  const gradientColors = activeTheme === 'dark' 
    ? ['#0F2042', '#061024'] as const
    : ['#EBF3FF', '#FFFFFF'] as const;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionRecord | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionRecord[]>([]);
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [resumeConfirmModalVisible, setResumeConfirmModalVisible] = useState(false);
  const [resumeSuccessModalVisible, setResumeSuccessModalVisible] = useState(false);
  const [lastCancelWasImmediate, setLastCancelWasImmediate] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions') as any;
      if (response) {
        setParentId(response.parent?.id || `unlinked-${user?.id}`);
        setActiveSubscription(response.activeSubscription || null);
        setSubscriptionHistory(response.subscriptions || []);
      }
    } catch (error: any) {
      console.warn('Failed to fetch subscription details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData();
  };

  const handleOpenPrivacy = () => {
    setDocumentHtml(PRIVACY_HTML);
    setDocumentTitle('Privacy Policy');
  };

  const handleOpenTerms = () => {
    setDocumentHtml(TERMS_HTML);
    setDocumentTitle('Terms of Service');
  };

  const executeCancellation = async (immediate: boolean = false) => {
    if (!activeSubscription) return;
    setLoading(true);
    setCancelModalVisible(false);
    setLastCancelWasImmediate(immediate);
    try {
      const response = await api.post('/subscriptions', {
        action: 'cancel',
        subscriptionId: activeSubscription.id,
        immediate,
      }) as any;
      if (response && response.success) {
        setSuccessModalVisible(true);
        fetchSubscriptionData();
      } else {
        Alert.alert('Error', response.error || 'Failed to cancel subscription.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    setCancelModalVisible(true);
  };

  const handleResumeSubscription = () => {
    setResumeConfirmModalVisible(true);
  };

  const executeResumeSubscription = async () => {
    if (!activeSubscription) return;
    setLoading(true);
    setResumeConfirmModalVisible(false);
    try {
      const response = await api.post('/subscriptions', {
        action: 'resume',
        subscriptionId: activeSubscription.id,
      }) as any;
      if (response && response.success) {
        setResumeSuccessModalVisible(true);
        fetchSubscriptionData();
      } else {
        Alert.alert('Error', response.error || 'Failed to re-enable auto-renewal.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to re-enable auto-renewal');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!activeSubscription || !activeSubscription.endDate) return 0;
    const start = new Date(activeSubscription.startDate).getTime();
    const end = new Date(activeSubscription.endDate).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const percentage = ((now - start) / (end - start)) * 100;
    return Math.round(percentage);
  };

  const activeFeatures = [
    { name: 'AI-Powered Performance Insights', active: true },
    { name: 'Direct Parent-Teacher Messaging', active: true },
    { name: 'Real-time Attendance Alerts', active: true },
    { name: 'Online child fee transaction history', active: true },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color="#34C759" />
        <ThemedText style={{ marginTop: 12 }}>Loading Subscription Details...</ThemedText>
      </SafeAreaView>
    );
  }

  const renderActiveSubscription = () => {
    if (!activeSubscription) {
      return (
        <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: '#8E8E9320' }]}>
              <Ionicons name="close-circle-outline" size={24} color="#8E8E93" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText style={{ fontSize: 16 }} type="defaultSemiBold">No Active Subscription</ThemedText>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>Free Plan Access</ThemedText>
            </View>
          </View>
        </View>
      );
    }

    const progress = getProgressPercentage();

    return (
      <View style={[styles.activeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: '#34C75915' }]}>
            <Ionicons name="ribbon-outline" size={24} color="#34C759" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText style={{ fontSize: 18 }} type="defaultSemiBold">{activeSubscription.planName}</ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText style={{ fontSize: 11, color: '#34C759', fontWeight: '700', textTransform: 'uppercase' }}>Active</ThemedText>
            </View>
          </View>
          <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>₹{activeSubscription.amount}</ThemedText>
        </View>

        {activeSubscription.endDate && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <ThemedText style={[styles.progressDateLabel, { color: colors.textSecondary }]}>Start Date</ThemedText>
              <ThemedText style={[styles.progressDateLabel, { color: colors.textSecondary }]}>Renewal Date</ThemedText>
            </View>
            <View style={styles.progressDates}>
              <ThemedText style={styles.progressDateValue}>{new Date(activeSubscription.startDate).toLocaleDateString()}</ThemedText>
              <ThemedText style={styles.progressDateValue}>{new Date(activeSubscription.endDate).toLocaleDateString()}</ThemedText>
            </View>
            
            <View style={[styles.progressBarBg, { backgroundColor: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : colors.backgroundSelected }]}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress}% elapsed of your current subscription cycle
            </ThemedText>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.featuresSection}>
          <ThemedText style={styles.sectionHeading} type="defaultSemiBold">Included Features</ThemedText>
          {activeFeatures.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.bulletDot} />
              <ThemedText style={[styles.featureText, { color: colors.text }]}>{f.name}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {activeSubscription.autoRenew ? (
          <TouchableOpacity style={styles.cancelLink} onPress={handleCancelSubscription} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={18} color="#FF3B30" style={{ marginRight: 6 }} />
            <ThemedText style={styles.cancelLinkText}>Cancel Auto-Renewal</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 8, marginTop: 8 }}>
            <View style={[styles.cancelledBanner, { backgroundColor: colors.background }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF9500" style={{ marginRight: 6 }} />
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                Auto-renew is off. Access terminates on {activeSubscription.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : ''}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.cancelLink, { borderColor: '#34C759', borderWidth: 1, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C75910', marginTop: 4 }]} 
              onPress={handleResumeSubscription} 
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-circle-outline" size={18} color="#34C759" style={{ marginRight: 6 }} />
              <ThemedText style={[styles.cancelLinkText, { color: '#34C759', fontWeight: '700' }]}>Re-enable Auto-Renewal</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderPolicyCard = () => (
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
        <TouchableOpacity onPress={handleOpenPrivacy}>
          <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
        </TouchableOpacity>
        <ThemedText style={{ color: colors.textSecondary, marginHorizontal: 8 }}>|</ThemedText>
        <TouchableOpacity onPress={handleOpenTerms}>
          <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Custom Header Layout */}
      <View style={[styles.customHeader, { borderBottomColor: colors.backgroundSelected, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.push('/(parent)/(tabs)/more')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <ThemedText style={styles.headerTitle} type="defaultSemiBold">My Subscriptions</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {Platform.OS === 'ios' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
          showsVerticalScrollIndicator={false}
        >
          {activeSubscription && (
            <>
              <ThemedText style={styles.sectionTitle} type="defaultSemiBold">Current Status</ThemedText>
              {renderActiveSubscription()}
            </>
          )}
          <IosSubscription />
          {renderPolicyCard()}
        </ScrollView>
      ) : (
        <AndroidSubscription 
          parentId={parentId || `unlinked-${user?.id}`} 
          onSuccess={fetchSubscriptionData} 
          activePlanId={activeSubscription?.planId?.toLowerCase() || 'basic'}
          autoRenew={activeSubscription?.autoRenew}
          headerComponent={
            activeSubscription ? (
              <>
                <ThemedText style={styles.sectionTitle} type="defaultSemiBold">Current Status</ThemedText>
                {renderActiveSubscription()}
              </>
            ) : undefined
          }
          onOpenPrivacy={handleOpenPrivacy}
          onOpenTerms={handleOpenTerms}
        />
      )}

      {/* In-app Document WebView Modal */}
      <Modal visible={!!documentHtml} animationType="slide" onRequestClose={() => setDocumentHtml(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundSelected, borderBottomWidth: 1 }]}>
            <TouchableOpacity onPress={() => setDocumentHtml(null)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle} type="defaultSemiBold">{documentTitle}</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <WebView 
            originWhitelist={['*']} 
            source={{ html: documentHtml || '' }} 
            style={{ flex: 1, backgroundColor: colors.background }} 
          />
        </SafeAreaView>
      </Modal>

      {/* Premium Cancellation Dialog Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: activeTheme === 'dark' ? '#0F2042' : colors.backgroundElement, borderColor: cardBorder, padding: 24, width: '90%', maxWidth: 400 }]}>
            <View style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="alert-circle" size={30} color="#0F2042" />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.confirmTitle} type="defaultSemiBold">
              Cancel Subscription?
            </ThemedText>
            
            <ThemedText style={[styles.confirmDesc, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }]}>
              Are you sure you want to cancel your plan? Premium features will be deactivated immediately.
            </ThemedText>
            
            <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  height: 46, 
                  borderRadius: 23, 
                  borderWidth: 1, 
                  borderColor: cardBorder, 
                  backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(11,30,64,0.04)', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}
                onPress={() => setCancelModalVisible(false)}
              >
                <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Keep Plan</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flex: 1, height: 46, borderRadius: 23, overflow: 'hidden' }}
                onPress={() => executeCancellation(true)}
              >
                <LinearGradient
                  colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                >
                  <ThemedText style={{ color: '#0F2042', fontWeight: 'bold', fontSize: 14 }}>Cancel Plan</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Cancelled Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: activeTheme === 'dark' ? '#0F2042' : colors.backgroundElement, borderColor: cardBorder, padding: 24, width: '90%', maxWidth: 400 }]}>
            <View style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="checkmark-circle" size={30} color="#0F2042" />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.confirmTitle} type="defaultSemiBold">
              Subscription Cancelled
            </ThemedText>
            
            <ThemedText style={[styles.confirmDesc, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
              Your subscription plan has been cancelled. Access to premium features was revoked.
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { paddingVertical: 0, overflow: 'hidden' }]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', paddingVertical: 12, justifyContent: 'center', alignItems: 'center' }}
              >
                <ThemedText style={[styles.confirmBtnTextActive, { color: '#0F2042', fontWeight: 'bold' }]}>Dismiss</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Re-enable Auto-Pay Confirmation Modal */}
      <Modal
        visible={resumeConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResumeConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: activeTheme === 'dark' ? '#0F2042' : colors.backgroundElement, borderColor: cardBorder, padding: 24, width: '90%', maxWidth: 400 }]}>
            <View style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="refresh" size={30} color="#0F2042" />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.confirmTitle} type="defaultSemiBold">
              Re-enable Auto-Pay?
            </ThemedText>
            
            <ThemedText style={[styles.confirmDesc, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
              Re-enable auto-renewal? You will continue to have uninterrupted access to premium features.
            </ThemedText>
            
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.confirmBtn, { paddingVertical: 0, overflow: 'hidden' }]}
                onPress={executeResumeSubscription}
              >
                <LinearGradient
                  colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: '100%', paddingVertical: 12, justifyContent: 'center', alignItems: 'center' }}
                >
                  <ThemedText style={[styles.confirmBtnTextActive, { color: '#0F2042', fontWeight: 'bold' }]}>Re-enable Auto-Renewal</ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: colors.backgroundSelected, width: '100%', paddingVertical: 12 }]}
                onPress={() => setResumeConfirmModalVisible(false)}
              >
                <ThemedText style={[styles.confirmBtnTextActive, { color: colors.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Re-enable Auto-Pay Success Modal */}
      <Modal
        visible={resumeSuccessModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResumeSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: activeTheme === 'dark' ? '#0F2042' : colors.backgroundElement, borderColor: cardBorder, padding: 24, width: '90%', maxWidth: 400 }]}>
            <View style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="checkmark-circle" size={30} color="#0F2042" />
              </LinearGradient>
            </View>
            
            <ThemedText style={styles.confirmTitle} type="defaultSemiBold">
              Auto-Renew Active 🎉
            </ThemedText>
            
            <ThemedText style={[styles.confirmDesc, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
              Auto-renewal is active. Your plan will renew automatically on the scheduled billing date.
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { paddingVertical: 0, overflow: 'hidden' }]}
              onPress={() => setResumeSuccessModalVisible(false)}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', paddingVertical: 12, justifyContent: 'center', alignItems: 'center' }}
              >
                <ThemedText style={[styles.confirmBtnTextActive, { color: '#0F2042', fontWeight: 'bold' }]}>Awesome</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  centerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitleContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 10,
    opacity: 0.8,
  },
  statusCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  activeCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#34C759',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressSection: {
    marginTop: 24,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDateLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  progressDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 8,
  },
  progressDateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 18,
    opacity: 0.2,
  },
  featuresSection: {
    paddingVertical: 4,
  },
  sectionHeading: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    opacity: 0.8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF3B3012',
  },
  cancelLinkText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
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
  warnIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B3015',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmBtn: {
    backgroundColor: '#FF3B3012',
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  confirmBtnTextActive: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtnTextCancel: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '700',
  },
});
