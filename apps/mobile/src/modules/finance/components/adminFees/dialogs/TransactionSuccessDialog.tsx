import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Portal, Dialog } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface TransactionSuccessDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  successReceiptNumber: string;
  successPaidAmount: number;
}

export function TransactionSuccessDialog({
  visible,
  onDismiss,
  colors,
  successReceiptNumber,
  successPaidAmount
}: TransactionSuccessDialogProps) {
  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={{ backgroundColor: colors.backgroundElement, borderRadius: 20, padding: 10, alignSelf: 'center', width: '85%', maxWidth: 360 }}
      >
        <Dialog.Content style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(52, 199, 89, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="checkmark-circle" size={42} color="#34C759" />
          </View>
          
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#34C759', textAlign: 'center' }}>
            Payment Successful!
          </ThemedText>
          
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            The payment receipt has been generated successfully.
          </ThemedText>
          
          <View style={{ width: '100%', backgroundColor: colors.background, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.backgroundSelected, marginTop: 4 }}>
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Receipt Number
            </ThemedText>
            <ThemedText style={{ fontSize: 15, fontWeight: 'bold', fontFamily: 'monospace', color: '#34C759', marginVertical: 4 }}>
              {successReceiptNumber}
            </ThemedText>
            
            <View style={{ width: '100%', height: 1, backgroundColor: colors.backgroundSelected, marginVertical: 10 }} />
            
            <ThemedText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Amount Paid
            </ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>
              ₹{successPaidAmount.toLocaleString()}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={{ width: '100%', height: 46, borderRadius: 12, backgroundColor: '#34C759', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}
            onPress={onDismiss}
          >
            <ThemedText style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>
              Finish
            </ThemedText>
          </TouchableOpacity>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}
