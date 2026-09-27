import React from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Receipt } from '../types';

import { shareReceiptAsPDF, printReceiptAsPDF } from '@/lib/pdf-export';

interface ReceiptDetailDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  selectedReceipt: Receipt | null;
  schoolLogo?: string;
  schoolName?: string;
}

export function ReceiptDetailDialog({
  visible,
  onDismiss,
  colors,
  selectedReceipt,
  schoolLogo,
  schoolName
}: ReceiptDetailDialogProps) {
  const handleDownloadPDF = async () => {
    if (!selectedReceipt) return;
    try {
      await shareReceiptAsPDF({
        receiptNumber: selectedReceipt.receiptNumber,
        paidDate: selectedReceipt.paidDate.slice(0, 10),
        studentName: selectedReceipt.studentName,
        studentId: (selectedReceipt as any).studentId || 'N/A',
        parentName: (selectedReceipt as any).parentName || 'Guardian',
        className: (selectedReceipt as any).className || 'N/A',
        paymentMethod: selectedReceipt.paymentMethod,
        paidAmount: selectedReceipt.paidAmount,
        remarks: `Receipt Generated via Admin Panel`,
        schoolName: schoolName || "DEMO ACADEMY",
        schoolLogo: schoolLogo || undefined,
        feeItems: selectedReceipt.feeItems.map(fi => ({
          feeCategoryName: fi ? fi.feeCategoryName : 'Fee Segment',
          paidAmount: fi ? fi.paidAmount : 0,
        }))
      });
    } catch (err) {
      console.error('Failed to download admin receipt PDF:', err);
    }
  };

  const handlePrintPDF = async () => {
    if (!selectedReceipt) return;
    try {
      await printReceiptAsPDF({
        receiptNumber: selectedReceipt.receiptNumber,
        paidDate: selectedReceipt.paidDate.slice(0, 10),
        studentName: selectedReceipt.studentName,
        studentId: (selectedReceipt as any).studentId || 'N/A',
        parentName: (selectedReceipt as any).parentName || 'Guardian',
        className: (selectedReceipt as any).className || 'N/A',
        paymentMethod: selectedReceipt.paymentMethod,
        paidAmount: selectedReceipt.paidAmount,
        remarks: `Receipt Generated via Admin Panel`,
        schoolName: schoolName || "DEMO ACADEMY",
        schoolLogo: schoolLogo || undefined,
        feeItems: selectedReceipt.feeItems.map(fi => ({
          feeCategoryName: fi ? fi.feeCategoryName : 'Fee Segment',
          paidAmount: fi ? fi.paidAmount : 0,
        }))
      });
    } catch (err) {
      console.error('Failed to print admin receipt PDF:', err);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.backgroundElement, borderRadius: 16 }}>
        <Dialog.Title style={{ color: colors.text }}>Transaction Receipt</Dialog.Title>
        <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedReceipt && (
              <View style={{ gap: 12 }}>
                <View style={{ alignItems: 'center', marginVertical: 8 }}>
                  <Ionicons name="receipt-outline" size={36} color="#007AFF" style={{ marginBottom: 4 }} />
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{selectedReceipt.receiptNumber}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>{selectedReceipt.paidDate.slice(0, 19).replace('T', ' ')}</ThemedText>
                </View>

                <View style={[styles.modalDivider, { borderBottomColor: colors.backgroundSelected }]} />

                <View style={styles.summaryRow}>
                  <ThemedText style={{ color: colors.textSecondary }}>Student Name:</ThemedText>
                  <ThemedText style={{ fontWeight: 'bold' }}>{selectedReceipt.studentName}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText style={{ color: colors.textSecondary }}>Payment Method:</ThemedText>
                  <ThemedText style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedReceipt.paymentMethod}</ThemedText>
                </View>

                <View style={[styles.modalDivider, { borderBottomColor: colors.backgroundSelected }]} />

                <ThemedText type="defaultSemiBold" style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>FEE SEGMENTS</ThemedText>
                {selectedReceipt.feeItems.map((fi, index) => {
                  if (!fi) return null;
                  return (
                    <View key={index} style={styles.summaryRow}>
                      <ThemedText style={{ fontSize: 13 }}>{fi.feeCategoryName}</ThemedText>
                      <ThemedText style={{ fontSize: 13, fontWeight: '500' }}>₹{fi.paidAmount}</ThemedText>
                    </View>
                  );
                })}

                <View style={[styles.modalDivider, { borderBottomColor: colors.backgroundSelected }]} />

                <View style={styles.summaryRow}>
                  <ThemedText style={{ fontSize: 15, fontWeight: 'bold' }}>Total Paid:</ThemedText>
                  <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: '#34C759' }}>₹{selectedReceipt.paidAmount}</ThemedText>
                </View>
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ gap: 6, paddingBottom: 16, paddingHorizontal: 12, justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
          <TouchableOpacity 
            onPress={onDismiss}
            style={{ 
              borderRadius: 20, 
              borderColor: '#8E8E93', 
              borderWidth: 1, 
              paddingHorizontal: 16, 
              height: 36, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <ThemedText style={{ color: '#8E8E93', fontWeight: '600', fontSize: 12 }}>
              Close
            </ThemedText>
          </TouchableOpacity>
          {selectedReceipt ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                onPress={handlePrintPDF}
                style={{ 
                  borderRadius: 20, 
                  borderColor: '#007AFF', 
                  borderWidth: 1, 
                  paddingHorizontal: 12, 
                  height: 36, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <Ionicons name="print-outline" size={15} color="#007AFF" />
                <ThemedText style={{ color: '#007AFF', fontWeight: '600', fontSize: 12 }}>
                  Print
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDownloadPDF}
                style={{ 
                  borderRadius: 20, 
                  backgroundColor: '#007AFF', 
                  paddingHorizontal: 12, 
                  height: 36, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <Ionicons name="share-social-outline" size={15} color="#FFF" />
                <ThemedText style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>
                  Share
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : <View />}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalDivider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
});
