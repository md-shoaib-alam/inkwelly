import React from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  useWindowDimensions, 
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';

interface SubscriptionLockModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export function SubscriptionLockModal({ visible, onClose, onSubscribe }: SubscriptionLockModalProps) {
  const { width } = useWindowDimensions();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const cardBg = isDark ? '#0F2042' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 30, 64, 0.12)';
  const textColor = isDark ? '#FFFFFF' : '#0B1E40';
  const subtitleColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(11, 30, 64, 0.6)';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: cardBg, 
            borderColor: cardBorder,
            maxWidth: width > 500 ? 400 : '90%'
          }
        ]}>
          {/* Header Lock Icon with Glow */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={['#4F7DF9', '#82F3FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGlow}
            >
              <Ionicons name="lock-closed" size={30} color="#0F2042" />
            </LinearGradient>
          </View>

          {/* Texts */}
          <ThemedText style={[styles.title, { color: textColor }]} type="defaultSemiBold">
            Premium Feature
          </ThemedText>
          <ThemedText style={[styles.description, { color: subtitleColor }]}>
            Unlock receipt downloading and printing with a premium subscription.
          </ThemedText>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              onPress={onSubscribe}
              activeOpacity={0.8}
              style={styles.actionBtn}
            >
              <LinearGradient
                colors={['#4F7DF9', '#82F3FF', '#12D0F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subscribeBtn}
              >
                <ThemedText numberOfLines={1} adjustsFontSizeToFit style={styles.subscribeBtnText}>Subscribe Now</ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              activeOpacity={0.7}
              style={[
                styles.cancelBtn, 
                { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 30, 64, 0.04)',
                  borderColor: cardBorder
                }
              ]}
            >
              <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.cancelBtnText, { color: textColor }]}>
                Maybe Later
              </ThemedText>
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
  },
  modalContent: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    width: '100%',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    width: '100%',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
  subscribeBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#0F2042',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
