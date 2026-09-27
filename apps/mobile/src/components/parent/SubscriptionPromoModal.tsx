import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '@/types';
import { AiPromo } from './subscription-promos/AiPromo';
import { ChatPromo } from './subscription-promos/ChatPromo';
import { ReceiptsPromo } from './subscription-promos/ReceiptsPromo';

interface SubscriptionPromoModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

export function SubscriptionPromoModal({
  visible,
  onClose,
  onUpgrade,
  isDark,
  colors,
}: SubscriptionPromoModalProps) {
  const promoBorderColor = isDark ? '#4F7DF9' : '#3B82F6';
  const promoTagBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 32, 66, 0.04)';
  const promoCheckColor = isDark ? '#82F3FF' : '#3B82F6';

  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setVariantIndex(Math.floor(Math.random() * 3));
    }
  }, [visible]);

  const renderPromoContent = () => {
    switch (variantIndex) {
      case 0:
        return <AiPromo colors={colors} />;
      case 1:
        return <ChatPromo colors={colors} />;
      case 2:
      default:
        return <ReceiptsPromo colors={colors} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmCard, { backgroundColor: isDark ? '#0F2042' : colors.backgroundElement, borderColor: promoBorderColor }]}>
          
          {renderPromoContent()}

          {/* Visual Highlight Cards */}
          <View style={styles.featuresList}>
            <View style={[styles.featureRow, { backgroundColor: promoTagBg }]}>
              <Ionicons name="analytics" size={16} color={promoCheckColor} />
              <ThemedText style={[styles.featureLabel, { color: colors.text }]}>AI Performance Analytics</ThemedText>
            </View>
            <View style={[styles.featureRow, { backgroundColor: promoTagBg }]}>
              <Ionicons name="chatbubbles" size={16} color={promoCheckColor} />
              <ThemedText style={[styles.featureLabel, { color: colors.text }]}>Direct Parent-Teacher Messaging</ThemedText>
            </View>
            <View style={[styles.featureRow, { backgroundColor: promoTagBg }]}>
              <Ionicons name="document-text" size={16} color={promoCheckColor} />
              <ThemedText style={[styles.featureLabel, { color: colors.text }]}>Export & Print Fee Receipts</ThemedText>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.dismissBtn, { 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB', 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB' 
              }]}
              onPress={onClose}
            >
              <ThemedText style={[styles.dismissBtnText, { color: colors.text }]}>Maybe Later</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.upgradeBtn}
              onPress={onUpgrade}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                <ThemedText style={styles.upgradeBtnText}>Upgrade Now</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F7DF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  upgradeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#0F2042',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
