import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { AddParentScreen } from '@/components/admin/parents/AddParentScreen';
import {
  ParentCreatedSuccessDialog,
  ParentCreatedData,
} from '@/components/admin/parents/ParentCreatedSuccessDialog';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';

export default function NewParentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: 'create' | 'edit';
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    occupation?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
  }>();

  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const dialogMode: 'create' | 'edit' = params.mode === 'edit' ? 'edit' : 'create';

  const [name, setName] = useState(params.name || '');
  const [username, setUsername] = useState(params.username || '');
  const [email, setEmail] = useState(params.email || '');
  const [phone, setPhone] = useState(params.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(params.alternatePhone || '');
  const [occupation, setOccupation] = useState(params.occupation || '');
  const [gender, setGender] = useState(params.gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState(params.dateOfBirth || '');
  const [address, setAddress] = useState(params.address || '');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Success dialog state
  const [createdSuccessData, setCreatedSuccessData] = useState<ParentCreatedData | null>(null);
  const [createdSuccessVisible, setCreatedSuccessVisible] = useState(false);

  const isFormValid = Boolean(name.trim() && phone.trim());

  const handleResetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setAlternatePhone('');
    setOccupation('');
    setGender('male');
    setDateOfBirth('');
    setAddress('');
    setPassword('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Name and phone number are required.');
      setErrorVisible(true);
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMsg('Please enter a valid email address.');
        setErrorVisible(true);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const data: any = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
        occupation: occupation.trim() || undefined,
        gender: gender || 'male',
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
      };

      if (dialogMode === 'create') {
        if (username.trim()) data.username = username.trim();
        if (password.trim()) data.password = password.trim();
      }

      if (dialogMode === 'create') {
        const res: any = await api.post('/parents', { action: 'create', ...data });
        const resData = res?.data || res || {};

        setCreatedSuccessData({
          id: resData.id,
          name: name.trim(),
          relationship: 'Parent',
          phone: phone.trim(),
          email: email.trim() || undefined,
          username: resData.username || username.trim() || 'PRN2026001',
          password: password.trim() || 'changeme123',
        });
        setCreatedSuccessVisible(true);
        adminCache.invalidate('parents');
      } else {
        await api.put('/parents', { id: params.id, ...data });
        adminCache.invalidate('parents', params.id);
        router.back();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to save parent record.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }} safeAreaTop>
      <AddParentScreen
        onBack={() => router.back()}
        colors={colors}
        isDark={activeTheme === 'dark'}
        dialogMode={dialogMode}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        alternatePhone={alternatePhone}
        setAlternatePhone={setAlternatePhone}
        occupation={occupation}
        setOccupation={setOccupation}
        gender={gender}
        setGender={setGender}
        dateOfBirth={dateOfBirth}
        setDateOfBirth={setDateOfBirth}
        address={address}
        setAddress={setAddress}
        password={password}
        setPassword={setPassword}
        isSubmitting={isSubmitting}
        isFormValid={isFormValid}
        onSubmit={handleSubmit}
        onReset={handleResetForm}
      />

      {/* Parent Account Created Success Dialog */}
      <ParentCreatedSuccessDialog
        visible={createdSuccessVisible}
        onDismiss={() => {
          setCreatedSuccessVisible(false);
          setCreatedSuccessData(null);
          router.back();
        }}
        data={createdSuccessData}
        onAddAnother={() => {
          setCreatedSuccessVisible(false);
          setCreatedSuccessData(null);
          handleResetForm();
        }}
        onViewProfile={(parentId) => {
          setCreatedSuccessVisible(false);
          setCreatedSuccessData(null);
          router.replace({ pathname: '/(admin)/parents/[id]', params: { id: parentId } });
        }}
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
            <Button textColor="#047857" onPress={() => setErrorVisible(false)}>
              Understood
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}
