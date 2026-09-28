import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

// Subcomponents
import { CertificateRecord } from '@/modules/certificates/components/adminCertificates/types';
import { handlePrintCertificate } from '@/modules/certificates/components/adminCertificates/printHelper';
import { CertificateCard } from '@/modules/certificates/components/adminCertificates/CertificateCard';
import { GenerateCertificateDialog } from '@/modules/certificates/components/adminCertificates/GenerateCertificateDialog';
import { RevokeCertificateDialog } from '@/modules/certificates/components/adminCertificates/RevokeCertificateDialog';
import { ViewCertificateDialog } from '@/modules/certificates/components/adminCertificates/ViewCertificateDialog';

export default function CertificatesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; section: string }[]>([]);
  const [tenantDetails, setTenantDetails] = useState<{ tenantName?: string; tenantAddress?: string; tenantPhone?: string; tenantEmail?: string; tenantWebsite?: string }>({});
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Modal Dialogs States
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewCert, setViewCert] = useState<CertificateRecord | null>(null);
  const [revokeCert, setRevokeCert] = useState<CertificateRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input fields
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formCertType, setFormCertType] = useState<string>('bonafide');
  const [formIssueDate, setFormIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch certificates history
  const fetchCertificates = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/certificates', { params: { limit: 50 } }) as any;
      if (res && Array.isArray(res.items)) {
        setCertificates(res.items);
      }
    } catch (err) {
      console.error('Failed to fetch certificates history:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch classes for generation form
  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes', { params: { mode: 'min' } });
      setClasses(Array.isArray(res) ? res : (res && Array.isArray((res as any).items) ? (res as any).items : []));
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  }, []);

  // Fetch students for selected class
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        setStudentsLoading(true);
        const res = await api.get('/students', {
          params: {
            classId: selectedClassId,
            mode: 'min',
            limit: 1000
          }
        }) as any;
        if (res && Array.isArray(res.items)) {
          setStudents(res.items);
        }
      } catch (err) {
        console.error('Failed to fetch class students:', err);
      } finally {
        setStudentsLoading(false);
      }
    }
    loadStudents();
  }, [selectedClassId]);

  // Fetch tenant details (name, address, etc.) for certificate rendering
  const fetchTenantDetails = useCallback(async () => {
    try {
      const res = await api.get('/tenant-settings');
      if (res) {
        setTenantDetails(res);
      }
    } catch (err) {
      console.error('Failed to fetch tenant details:', err);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
    fetchClasses();
    fetchTenantDetails();
  }, [fetchCertificates, fetchClasses, fetchTenantDetails]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCertificates();
  };

  const handleOpenGenerate = () => {
    setSelectedClassId('');
    setFormStudentId('');
    setFormCertType('bonafide');
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!formStudentId) {
      Alert.alert('Error', 'Please select a student.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        studentId: formStudentId,
        certificateType: formCertType,
        issueDate: formIssueDate,
        content: {
          notes: formNotes
        }
      };

      await api.post('/certificates', payload);
      Alert.alert('Success', 'Certificate Generated successfully.');
      setGenerateOpen(false);
      fetchCertificates();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeCert) return;
    try {
      setIsSubmitting(true);
      await api.put('/certificates', {
        id: revokeCert.id,
        status: 'revoked'
      });
      Alert.alert('Success', 'Certificate Revoked.');
      setRevokeCert(null);
      fetchCertificates();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to revoke certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (cert: CertificateRecord) => {
    await handlePrintCertificate(cert, tenantDetails, user);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Main List */}
      {isLoading && certificates.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlashList
          data={certificates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                No certificates generated yet.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <CertificateCard
              item={item}
              colors={colors}
              isAdmin={isAdmin}
              onView={(cert) => setViewCert(cert)}
              onRevoke={(cert) => setRevokeCert(cert)}
            />
          )}
        />
      )}

      {/* FAB Button */}
      {isAdmin && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleOpenGenerate}
          color="#FFF"
        />
      )}

      {/* Dialog: Generate Certificate */}
      <GenerateCertificateDialog
        visible={generateOpen}
        onDismiss={() => setGenerateOpen(false)}
        colors={colors}
        classes={classes}
        students={students}
        studentsLoading={studentsLoading}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        formStudentId={formStudentId}
        setFormStudentId={setFormStudentId}
        formCertType={formCertType}
        setFormCertType={setFormCertType}
        formIssueDate={formIssueDate}
        setFormIssueDate={setFormIssueDate}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        isSubmitting={isSubmitting}
        onGenerate={handleGenerate}
      />

      {/* Dialog: Revoke Confirmation */}
      <RevokeCertificateDialog
        visible={!!revokeCert}
        onDismiss={() => setRevokeCert(null)}
        colors={colors}
        certificate={revokeCert}
        isSubmitting={isSubmitting}
        onRevoke={handleRevoke}
      />

      {/* Certificate Full Template Viewer Modal */}
      <ViewCertificateDialog
        visible={!!viewCert}
        onDismiss={() => setViewCert(null)}
        colors={colors}
        certificate={viewCert}
        tenantDetails={tenantDetails}
        user={user}
        onDownload={handleDownload}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#92400E',
    borderRadius: 28,
  },
});
