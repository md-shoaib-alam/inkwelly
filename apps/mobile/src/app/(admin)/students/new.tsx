import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { AddStudentScreen, StudentFormData } from '@/modules/people/components/adminStudents/AddStudentScreen';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';

const initialStudentFormData: StudentFormData = {
  name: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  rollNumber: '',
  classId: '',
  gender: 'male',
  dateOfBirth: '',
  bloodGroup: '',
  parentId: '',
  transportEnabled: false,
  routeId: '',
  pickupPoint: '',
};

export default function NewStudentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: 'create' | 'edit';
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    rollNumber?: string;
    classId?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    parentId?: string;
    transportEnabled?: string;
    routeId?: string;
    pickupPoint?: string;
  }>();

  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const dialogMode: 'create' | 'edit' = params.mode === 'edit' ? 'edit' : 'create';

  const [studentFormData, setStudentFormData] = useState<StudentFormData>(() => {
    if (params.mode === 'edit') {
      return {
        name: params.name || '',
        username: params.username || '',
        email: params.email || '',
        password: '',
        phone: params.phone || '',
        rollNumber: params.rollNumber || '',
        classId: params.classId || '',
        gender: params.gender || 'male',
        dateOfBirth: params.dateOfBirth || '',
        bloodGroup: params.bloodGroup || '',
        parentId: params.parentId || '',
        transportEnabled: params.transportEnabled === 'true',
        routeId: params.routeId || '',
        pickupPoint: params.pickupPoint || '',
      };
    }
    return initialStudentFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetForm = () => {
    setStudentFormData(initialStudentFormData);
  };

  const handleSubmit = async () => {
    if (!studentFormData.name.trim() || !studentFormData.rollNumber.trim() || !studentFormData.classId) {
      setErrorMsg('Name, Class, and Roll Number are required.');
      setErrorVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      if (dialogMode === 'create') {
        await api.post('/students', studentFormData);
        adminCache.invalidate('students');
      } else {
        await api.put('/students', { id: params.id, ...studentFormData });
        adminCache.invalidate('students', params.id);
      }
      router.back();
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to save student record.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }} safeAreaTop>
      <AddStudentScreen
        onBack={() => router.back()}
        colors={colors}
        isDark={activeTheme === 'dark'}
        dialogMode={dialogMode}
        formData={studentFormData}
        setFormData={setStudentFormData}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onReset={handleResetForm}
      />

      {/* Error Alert Dialog */}
      <Portal>
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#EF4444' }}>Operation Failed</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>{errorMsg}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setErrorVisible(false)}>
              Understood
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}
