import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { AddTeacherScreen } from '@/modules/people/components/adminTeachers/AddTeacherScreen';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';

export default function NewTeacherScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: 'create' | 'edit';
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    address?: string;
    gender?: string;
    dateOfBirth?: string;
    teacherId?: string;
    qualification?: string;
    experience?: string;
    role?: string;
    subjects?: string;
    joiningDate?: string;
    status?: string;
  }>();

  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const dialogMode: 'create' | 'edit' = params.mode === 'edit' ? 'edit' : 'create';

  const [name, setName] = useState(params.name || '');
  const [email, setEmail] = useState(params.email || '');
  const [phone, setPhone] = useState(params.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(params.alternatePhone || '');
  const [address, setAddress] = useState(params.address || '');
  const [gender, setGender] = useState(params.gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState(params.dateOfBirth || '');
  const [teacherId, setTeacherId] = useState(params.teacherId || '');
  const [qualification, setQualification] = useState(params.qualification || 'B.Ed');
  const [experience, setExperience] = useState(params.experience || '');
  const [role, setRole] = useState(params.role || 'Faculty Member');
  const [subjects, setSubjects] = useState(params.subjects || 'Mathematics');
  const [joiningDate, setJoiningDate] = useState(params.joiningDate || '');
  const [status, setStatus] = useState(params.status || 'active');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAlternatePhone('');
    setAddress('');
    setGender('male');
    setDateOfBirth('');
    setTeacherId('');
    setQualification('B.Ed');
    setExperience('');
    setRole('Faculty Member');
    setSubjects('Mathematics');
    setJoiningDate('');
    setStatus('active');
    setPassword('');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, Phone).');
      setErrorVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const data: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
        address: address.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        teacherId: teacherId.trim() || undefined,
        qualification,
        experience: experience.trim() || undefined,
        role: 'Faculty Member',
        subjects: subjects ? [subjects] : undefined,
        joiningDate: joiningDate || undefined,
        status,
      };

      if (dialogMode === 'create') {
        data.password = password.trim() || 'changeme123';
        await api.post('/teachers', data);
        adminCache.invalidate('teachers');
        router.back();
      } else {
        const targetId = params.id;
        await api.put('/teachers', { id: targetId, ...data });
        adminCache.invalidate('teachers', targetId);
        router.back();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to save teacher record.');
      setErrorVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }} safeAreaTop>
      <AddTeacherScreen
        onBack={() => router.back()}
        colors={colors}
        isDark={activeTheme === 'dark'}
        dialogMode={dialogMode}
        name={name}
        setName={setName}
        gender={gender}
        setGender={setGender}
        dateOfBirth={dateOfBirth}
        setDateOfBirth={setDateOfBirth}
        teacherId={teacherId}
        setTeacherId={setTeacherId}
        qualification={qualification}
        setQualification={setQualification}
        experience={experience}
        setExperience={setExperience}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        alternatePhone={alternatePhone}
        setAlternatePhone={setAlternatePhone}
        address={address}
        setAddress={setAddress}
        role={role}
        subjects={subjects}
        setSubjects={setSubjects}
        joiningDate={joiningDate}
        setJoiningDate={setJoiningDate}
        status={status}
        setStatus={setStatus}
        password={password}
        setPassword={setPassword}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onReset={handleResetForm}
      />

      {/* Error Dialog */}
      <Portal>
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#EF4444' }}>Notice</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>{errorMsg}</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#059669" onPress={() => setErrorVisible(false)}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}
