import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionAlertProps {
  tenantEndDate?: string;
}

export function SubscriptionAlert({ tenantEndDate }: SubscriptionAlertProps) {
  if (!tenantEndDate) return null;

  const endDate = new Date(tenantEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  if (!isExpired && !isExpiringSoon) return null;

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isExpired ? '#FF3B30' : '#FF9500' }
    ]}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={24} color="#FFF" />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>
          {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
        </ThemedText>
        <ThemedText style={styles.message}>
          {isExpired 
            ? 'Your school subscription has expired. Please renew to continue.' 
            : `Your subscription will expire in ${daysRemaining} days.`}
        </ThemedText>
      </View>
      <TouchableOpacity style={styles.renewButton}>
        <ThemedText style={styles.renewText}>Renew</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  message: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.9,
  },
  renewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  renewText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
