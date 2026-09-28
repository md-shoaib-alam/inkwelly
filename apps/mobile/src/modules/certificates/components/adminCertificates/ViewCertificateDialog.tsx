import React from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { CertificateRecord, formatDate, getBodyText } from './types';

interface ViewCertificateDialogProps {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
  certificate: CertificateRecord | null;
  tenantDetails: any;
  user: any;
  onDownload: (cert: CertificateRecord) => void;
}

export function ViewCertificateDialog({
  visible,
  onDismiss,
  colors,
  certificate,
  tenantDetails,
  user,
  onDownload,
}: ViewCertificateDialogProps) {
  if (!certificate) return null;

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={styles.viewModal}
      >
        <Dialog.Title style={{ color: '#92400E', textAlign: 'center', fontWeight: 'bold' }}>Certificate Preview</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.certificateOuterFrame}>
              <View style={styles.certificateInnerFrame}>
                {/* Corner accents */}
                <View style={[styles.cornerAccent, { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2 }]} />
                <View style={[styles.cornerAccent, { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2 }]} />
                <View style={[styles.cornerAccent, { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
                <View style={[styles.cornerAccent, { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2 }]} />

                {/* School Header */}
                <View style={styles.certHeader}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FEF3C7', marginBottom: 8 }}>
                    <Ionicons name="school" size={28} color="#d97706" />
                  </View>
                  <ThemedText style={styles.certSchoolName}>{(tenantDetails.tenantName || user?.tenantName || '').toUpperCase()}</ThemedText>
                  <ThemedText style={styles.certSchoolSub}>{(tenantDetails as any)?.affiliation || '  '}</ThemedText>
                  <ThemedText style={styles.certSchoolSub}>{tenantDetails.tenantAddress || '  '}</ThemedText>
                </View>

                <View style={styles.certHeaderLineContainer}>
                  <View style={styles.certHeaderLine} />
                  <View style={styles.certHeaderDiamond} />
                  <View style={styles.certHeaderLine} />
                </View>

                {/* Cert Title */}
                <View style={styles.certTitleWrapper}>
                  <ThemedText style={styles.certTitleMain}>
                    {(certificate.certificateType || '').toUpperCase()}
                  </ThemedText>
                  <ThemedText style={styles.certTitleSub}>CERTIFICATE</ThemedText>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                    <ThemedText style={styles.certNoText}>CERTIFICATE NO: </ThemedText>
                    <ThemedText style={[styles.certNoText, { fontWeight: '800', color: '#111827' }]}>{certificate.certificateNo}</ThemedText>
                  </View>
                </View>

                {/* Certificate Content Body */}
                <View style={styles.certContentBody}>
                  <ThemedText style={styles.certItalicIntro}>This is to certify that</ThemedText>
                  <View style={styles.certNamePlaceholder}>
                    <ThemedText style={styles.certStudentName}>
                      {certificate.content?.studentName || certificate.student?.user?.name || '  '}
                    </ThemedText>
                  </View>

                  {/* Detail grids */}
                  <View style={styles.certGrid}>
                    <View style={styles.certGridRow}>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Roll Number</ThemedText>
                        <ThemedText style={styles.certGridVal}>{certificate.content?.rollNumber || certificate.student?.rollNumber || '  '}</ThemedText>
                      </View>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Class / Grade</ThemedText>
                        <ThemedText style={styles.certGridVal}>
                          {certificate.content?.class ? `${certificate.content.class.grade} - ${certificate.content.class.name}` : '  '}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.certGridRow}>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Date of Birth</ThemedText>
                        <ThemedText style={styles.certGridVal}>{formatDate(certificate.content?.dateOfBirth || '')}</ThemedText>
                      </View>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Gender</ThemedText>
                        <ThemedText style={styles.certGridVal}>{certificate.content?.gender || '  '}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.certGridRow}>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Parent's Name</ThemedText>
                        <ThemedText style={styles.certGridVal}>{certificate.content?.parentName || '  '}</ThemedText>
                      </View>
                      <View style={styles.certGridCell}>
                        <ThemedText style={styles.certGridLabel}>Admission Date</ThemedText>
                        <ThemedText style={styles.certGridVal}>{formatDate(certificate.content?.admissionDate || '')}</ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText style={styles.certMainTextDescription}>{getBodyText(certificate, tenantDetails, user?.tenantName)}</ThemedText>

                  {certificate.content?.notes && (
                    <View style={styles.certRemarksBox}>
                      <ThemedText style={styles.certRemarksLabel}>REMARKS</ThemedText>
                      <ThemedText style={styles.certRemarksVal}>{certificate.content.notes}</ThemedText>
                    </View>
                  )}
                </View>

                {/* Footer issue & signature */}
                <View style={styles.certFooter}>
                  <View>
                    <ThemedText style={styles.certFooterLabel}>DATE OF ISSUE</ThemedText>
                    <ThemedText style={styles.certFooterVal}>{formatDate(certificate.issueDate)}</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center', minWidth: 100 }}>
                    <View style={styles.sigLine} />
                    <ThemedText style={styles.certFooterValLabel} numberOfLines={1}>PRINCIPAL</ThemedText>
                  </View>
                </View>

                {/* Revoked overlay watermark */}
                {certificate.status === 'revoked' && (
                  <View style={styles.revokedOverlay}>
                    <ThemedText style={styles.revokedStamp}>REVOKED</ThemedText>
                  </View>
                )}

              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
          <Button
            mode="outlined"
            textColor="#8E8E93"
            onPress={onDismiss}
            style={{ borderRadius: 999, borderColor: '#E5E5EA' }}
            contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
          >
            Close
          </Button>
          <Button
            mode="contained"
            textColor="#FFF"
            buttonColor="#92400E"
            icon="printer"
            onPress={() => onDownload(certificate)}
            style={{ borderRadius: 999 }}
            contentStyle={{ paddingHorizontal: 16, paddingVertical: 2 }}
          >
            Print PDF
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  viewModal: {
    maxHeight: '90%',
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  certificateOuterFrame: {
    borderWidth: 2,
    borderColor: '#d97706',
    padding: 3,
    borderRadius: 8,
  },
  certificateInnerFrame: {
    borderWidth: 1,
    borderColor: '#d97706',
    padding: 16,
    borderRadius: 6,
    backgroundColor: '#FFF',
    position: 'relative',
    minHeight: 450,
  },
  cornerAccent: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: '#d97706',
  },
  certHeader: {
    alignItems: 'center',
    marginTop: 12,
  },
  certSchoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#78350F',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 6,
    textAlign: 'center',
  },
  certSchoolSub: {
    fontSize: 9,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 1,
  },
  certHeaderLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  certHeaderLine: {
    height: 1,
    width: 60,
    backgroundColor: '#92400E',
  },
  certHeaderDiamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#92400E',
    marginHorizontal: 8,
  },
  certTitleWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  certTitleMain: {
    fontSize: 20,
    fontWeight: '500',
    color: '#78350F',
    letterSpacing: 2,
  },
  certTitleSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    letterSpacing: 3,
    marginTop: 2,
  },
  certNoText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 4,
  },
  certContentBody: {
    alignItems: 'center',
    marginTop: 8,
  },
  certItalicIntro: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#4B5563',
  },
  certNamePlaceholder: {
    borderBottomWidth: 1,
    borderBottomColor: '#d97706',
    minWidth: 180,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    marginVertical: 8,
  },
  certStudentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'uppercase',
  },
  certGrid: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginVertical: 10,
  },
  certGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  certGridCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  certGridLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  certGridVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 1,
  },
  certMainTextDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  certRemarksBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FCD34D',
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    padding: 6,
    width: '100%',
    marginTop: 10,
  },
  certRemarksLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#78350F',
    letterSpacing: 1,
    marginBottom: 2,
  },
  certRemarksVal: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#4B5563',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  certFooterLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  certFooterVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 2,
  },
  sigLine: {
    width: 80,
    height: 1,
    backgroundColor: '#9CA3AF',
    marginBottom: 4,
  },
  certFooterValLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    minWidth: 100,
  },
  revokedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 6,
    zIndex: 10,
  },
  revokedStamp: {
    fontSize: 44,
    fontWeight: '900',
    color: '#DC2626',
    borderWidth: 4,
    borderColor: '#DC2626',
    padding: 8,
    borderRadius: 12,
    transform: [{ rotate: '-20deg' }],
  },
});
