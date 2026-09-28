import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

export interface ParentCreatedData {
  id?: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  username: string;
  password?: string;
}

interface ParentCreatedSuccessDialogProps {
  visible: boolean;
  onDismiss: () => void;
  data: ParentCreatedData | null;
  onAddAnother?: () => void;
  onViewProfile?: (parentId: string) => void;
}

function getInitials(name: string): string {
  if (!name) return 'PR';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ParentCreatedSuccessDialog({
  visible,
  onDismiss,
  data,
  onAddAnother,
  onViewProfile,
}: ParentCreatedSuccessDialogProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!data) return null;

  const loginId = data.username || '—';
  const password = data.password || 'changeme123';

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Copied', `${label} copied to clipboard!`);
  };

  const handleCopyBoth = async () => {
    const text = `Parent Portal Login Details:\nParent Login ID: ${loginId}\nPassword: ${password}\nPortal Login: /login`;
    await Clipboard.setStringAsync(text);
    setCopiedField('both');
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Copied', 'Login ID and Password copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const message = `Hello ${data.name},\nHere are your Parent Portal login credentials:\n\nParent Login ID: ${loginId}\nPassword: ${password}\n\nPlease keep these credentials secure.`;
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const phoneParam = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone ? `91${cleanPhone}` : '';
    const waUrl = phoneParam
      ? `whatsapp://send?phone=${phoneParam}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.openURL(waUrl).catch(() => {
      const webUrl = phoneParam
        ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Unable to open WhatsApp', 'Please ensure WhatsApp is installed on your device.');
      });
    });
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Your School Parent Portal Login Credentials');
    const body = encodeURIComponent(
      `Dear ${data.name},\n\nYour parent account has been successfully created. Here are your login credentials:\n\nParent Login ID: ${loginId}\nPassword: ${password}\n\nBest regards,\nSchool Administration`
    );
    Linking.openURL(`mailto:${data.email || ''}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Error', 'Could not open email client.');
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
      transparent={false}
    >
      <SafeAreaView 
        style={[styles.screenContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
        edges={['top', 'bottom']}
      >
        {/* Top Floating Close Button */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[
              styles.closeCircleBtn,
              {
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                borderColor: isDark ? '#374151' : '#E2E8F0',
              },
            ]}
            onPress={onDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={isDark ? '#E5E7EB' : '#334155'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Confetti Celebration Graphic & Title */}
          <View style={styles.heroSection}>
            <View style={styles.confettiContainer}>
              {/* Surrounding celebratory confetti particle sprinkles */}
              <View style={[styles.confettiDot, styles.dotTopLeft, { backgroundColor: '#34D399' }]} />
              <View style={[styles.confettiPill, styles.pillTopRight, { backgroundColor: '#059669' }]} />
              <View style={[styles.confettiDot, styles.dotMiddleLeft, { backgroundColor: '#FBBF24' }]} />
              <View style={[styles.confettiDot, styles.dotMiddleRight, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.confettiDot, styles.dotBottomLeft, { backgroundColor: '#3B82F6' }]} />
              <View style={[styles.confettiDot, styles.dotBottomLeftSub, { backgroundColor: '#10B981' }]} />
              <View style={[styles.confettiDot, styles.dotBottomRight, { backgroundColor: '#2563EB' }]} />
              <View style={[styles.confettiDot, styles.dotBottomRightSub, { backgroundColor: '#F59E0B' }]} />

              {/* Glowing Mint Circle with Checkmark */}
              <View style={[styles.checkCircleGlow, { backgroundColor: isDark ? '#064E3B40' : '#D1FAE5' }]}>
                <View style={styles.checkCircleInner}>
                  <Ionicons name="checkmark" size={34} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <ThemedText style={[styles.mainHeadline, { color: colors.text }]}>
              Parent Account Created Successfully!
            </ThemedText>

            <ThemedText style={[styles.subHeadline, { color: colors.textSecondary }]}>
              The parent has been added to the system. You can now share the login credentials with them to access the parent portal.
            </ThemedText>
          </View>

          {/* Card 1: Parent Summary Profile Card */}
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.profileRow}>
              {/* Large Soft Mint Avatar */}
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isDark ? '#064E3B40' : '#D1FAE5',
                  },
                ]}
              >
                <ThemedText style={styles.avatarText}>{getInitials(data.name)}</ThemedText>
              </View>

              {/* Details & View Profile Button */}
              <View style={styles.profileInfoContainer}>
                <View style={styles.nameHeaderRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <ThemedText style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                      {data.name}
                    </ThemedText>
                    <ThemedText style={[styles.profileRole, { color: colors.textSecondary }]}>
                      {data.relationship || 'Mother'}
                    </ThemedText>
                  </View>

                  {onViewProfile && data.id ? (
                    <TouchableOpacity
                      style={[
                        styles.viewProfilePill,
                        {
                          backgroundColor: isDark ? '#064E3B20' : '#FFFFFF',
                          borderColor: '#A7F3D0',
                        },
                      ]}
                      onPress={() => {
                        onDismiss();
                        onViewProfile(data.id!);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={13} color="#059669" />
                      <ThemedText style={styles.viewProfilePillText}>View Parent Profile</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Phone & Email Rows */}
                <View style={styles.contactDetails}>
                  {data.phone ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                      <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
                        {data.phone.startsWith('+') ? data.phone : `+91 ${data.phone}`}
                      </ThemedText>
                    </View>
                  ) : null}

                  {data.email ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                      <ThemedText style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {data.email}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* Card 2: Login Credentials Section (Light Mint Card) */}
          <View
            style={[
              styles.credentialsCard,
              {
                backgroundColor: isDark ? '#064E3B18' : '#F0FDF4',
                borderColor: isDark ? '#064E3B50' : '#DCFCE7',
              },
            ]}
          >
            {/* Header: Key icon + Login Credentials + Active Badge */}
            <View style={styles.credentialsHeader}>
              <View style={styles.credentialsTitleWrap}>
                <Ionicons name="key" size={19} color="#059669" />
                <ThemedText style={[styles.credentialsCardTitle, { color: colors.text }]}>
                  Login Credentials
                </ThemedText>
              </View>

              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: isDark ? '#064E3B60' : '#DCFCE7',
                    borderColor: '#86EFAC',
                  },
                ]}
              >
                <View style={styles.activeDot} />
                <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.credentialsInstruction, { color: colors.textSecondary }]}>
              Share these credentials with the parent to access the parent portal.
            </ThemedText>

            {/* Parent Login ID Field Box */}
            <View
              style={[
                styles.fieldContainer,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E2E8F0',
                },
              ]}
            >
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Parent Login ID
              </ThemedText>
              <View
                style={[
                  styles.fieldInnerRow,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                    borderColor: isDark ? '#374151' : '#E2E8F0',
                  },
                ]}
              >
                <ThemedText style={[styles.fieldCodeValue, { color: colors.text }]}>
                  {loginId}
                </ThemedText>
                <TouchableOpacity
                  style={styles.fieldActionBtn}
                  onPress={() => handleCopy(loginId, 'Parent Login ID')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={copiedField === 'Parent Login ID' ? 'checkmark' : 'copy-outline'}
                    size={17}
                    color={copiedField === 'Parent Login ID' ? '#059669' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Field Box */}
            <View
              style={[
                styles.fieldContainer,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E2E8F0',
                },
              ]}
            >
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Password
              </ThemedText>
              <View
                style={[
                  styles.fieldInnerRow,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                    borderColor: isDark ? '#374151' : '#E2E8F0',
                  },
                ]}
              >
                <ThemedText style={[styles.fieldCodeValue, { color: colors.text }]}>
                  {showPassword ? password : '••••••••••••'}
                </ThemedText>
                <View style={styles.actionsGroup}>
                  <TouchableOpacity
                    style={styles.fieldActionBtn}
                    onPress={() => handleCopy(password, 'Password')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={copiedField === 'Password' ? 'checkmark' : 'copy-outline'}
                      size={17}
                      color={copiedField === 'Password' ? '#059669' : colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fieldActionBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action 1: Full-width Solid Green "Share via WhatsApp" Button */}
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleShareWhatsApp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
              <ThemedText style={styles.whatsappButtonText}>Share via WhatsApp</ThemedText>
            </TouchableOpacity>

            {/* Action 2: Split 2 Outline Buttons ("Share via Email" + "Copy Both") */}
            <View style={styles.splitRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: '#86EFAC',
                  },
                ]}
                onPress={handleShareEmail}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                <ThemedText style={styles.secondaryActionBtnText}>Share via Email</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: '#86EFAC',
                  },
                ]}
                onPress={handleCopyBoth}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copiedField === 'both' ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color="#059669"
                  style={{ marginRight: 6 }}
                />
                <ThemedText style={styles.secondaryActionBtnText}>
                  {copiedField === 'both' ? 'Copied Both!' : 'Copy Both'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: Important Notes (Soft Blue Callout Card) */}
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: isDark ? '#082F4930' : '#F0F9FF',
                borderColor: isDark ? '#0C4A6E70' : '#E0F2FE',
              },
            ]}
          >
            <View style={styles.noticeHeaderRow}>
              <Ionicons name="information-circle" size={18} color="#0284C7" />
              <ThemedText style={styles.noticeTitleText}>Important Notes</ThemedText>
            </View>

            <View style={styles.noticeBulletList}>
              <View style={styles.noticeBulletRow}>
                <ThemedText style={[styles.bulletDot, { color: isDark ? '#38BDF8' : '#0369A1' }]}>•</ThemedText>
                <ThemedText style={[styles.bulletText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  This login ID and password allows the parent to access the parent portal.
                </ThemedText>
              </View>

              <View style={styles.noticeBulletRow}>
                <ThemedText style={[styles.bulletDot, { color: isDark ? '#38BDF8' : '#0369A1' }]}>•</ThemedText>
                <ThemedText style={[styles.bulletText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  You can share these credentials via WhatsApp or Email using the buttons above.
                </ThemedText>
              </View>

              <View style={styles.noticeBulletRow}>
                <ThemedText style={[styles.bulletDot, { color: isDark ? '#38BDF8' : '#0369A1' }]}>•</ThemedText>
                <ThemedText style={[styles.bulletText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  The parent can change their password after first login.
                </ThemedText>
              </View>

              <View style={styles.noticeBulletRow}>
                <ThemedText style={[styles.bulletDot, { color: isDark ? '#38BDF8' : '#0369A1' }]}>•</ThemedText>
                <ThemedText style={[styles.bulletText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  If needed, you can reset the password anytime from the parent's profile.
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Fixed Sticky Footer */}
        <View
          style={[
            styles.bottomStickyFooter,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderTopColor: isDark ? '#1F2937' : '#F1F5F9',
            },
          ]}
        >
          {onAddAnother ? (
            <TouchableOpacity
              style={[
                styles.addAnotherButton,
                {
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: '#86EFAC',
                },
              ]}
              onPress={onAddAnother}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color="#059669" style={{ marginRight: 4 }} />
              <ThemedText style={styles.addAnotherButtonText}>Add Another Parent</ThemedText>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.doneButton, { flex: onAddAnother ? 1 : 1 }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <ThemedText style={styles.doneButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 4,
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  confettiContainer: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  checkCircleGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  confettiDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  confettiPill: {
    position: 'absolute',
    width: 6,
    height: 14,
    borderRadius: 3,
  },
  dotTopLeft: {
    top: 6,
    left: 24,
  },
  pillTopRight: {
    top: 4,
    right: 22,
    transform: [{ rotate: '25deg' }],
  },
  dotMiddleLeft: {
    top: 32,
    left: 8,
  },
  dotMiddleRight: {
    top: 36,
    right: 10,
  },
  dotBottomLeft: {
    bottom: 12,
    left: 4,
  },
  dotBottomLeftSub: {
    bottom: 2,
    left: 20,
  },
  dotBottomRight: {
    bottom: 14,
    right: 6,
  },
  dotBottomRightSub: {
    bottom: 0,
    right: 24,
  },
  mainHeadline: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subHeadline: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  /* Profile Card */
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  profileInfoContainer: {
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  viewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewProfilePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  contactDetails: {
    marginTop: 10,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Credentials Card */
  credentialsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  credentialsCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  credentialsInstruction: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  fieldContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  fieldCodeValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    letterSpacing: 0.5,
  },
  fieldActionBtn: {
    padding: 6,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    height: 44,
    marginTop: 4,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Important Notes Card */
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  noticeTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  noticeBulletList: {
    gap: 6,
  },
  noticeBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    fontSize: 13,
    lineHeight: 17,
  },
  bulletText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  /* Bottom Sticky Footer */
  bottomStickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  addAnotherButton: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  addAnotherButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    height: 44,
    borderRadius: 12,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
