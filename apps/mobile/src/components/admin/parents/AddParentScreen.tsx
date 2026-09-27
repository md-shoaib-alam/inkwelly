import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { AddParentHeader } from './form/AddParentHeader';
import { PersonalInfoSection } from './form/PersonalInfoSection';
import { ContactInfoSection } from './form/ContactInfoSection';
import { AddressSection } from './form/AddressSection';
import { AccountSettingsSection } from './form/AccountSettingsSection';
import { AddParentFooter } from './form/AddParentFooter';

export interface AddParentScreenProps {
  onBack: () => void;
  colors: any;
  isDark?: boolean;
  dialogMode: 'create' | 'edit';
  name: string;
  setName: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  alternatePhone?: string;
  setAlternatePhone?: (val: string) => void;
  occupation: string;
  setOccupation: (val: string) => void;
  gender?: string;
  setGender?: (val: string) => void;
  dateOfBirth?: string;
  setDateOfBirth?: (val: string) => void;
  address?: string;
  setAddress?: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isSubmitting: boolean;
  isFormValid: boolean;
  onSubmit: () => void;
  onReset?: () => void;
}

export function AddParentScreen({
  onBack,
  colors,
  isDark = false,
  dialogMode,
  name,
  setName,
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  alternatePhone = '',
  setAlternatePhone,
  occupation,
  setOccupation,
  gender = 'male',
  setGender,
  dateOfBirth = '',
  setDateOfBirth,
  address = '',
  setAddress,
  password,
  setPassword,
  isSubmitting,
  isFormValid,
  onSubmit,
  onReset,
}: AddParentScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width >= 650;

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header Bar */}
        <AddParentHeader
          onBack={onBack}
          dialogMode={dialogMode}
          colors={colors}
          isDark={isDark}
        />

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Personal Information */}
          <PersonalInfoSection
            isDark={isDark}
            name={name}
            setName={setName}
            gender={gender}
            setGender={setGender}
            dateOfBirth={dateOfBirth}
            onOpenDobPicker={() => setDobPickerOpen(true)}
            occupation={occupation}
            setOccupation={setOccupation}
          />

          {/* SECTION 2: Contact Information */}
          <ContactInfoSection
            isDark={isDark}
            phone={phone}
            setPhone={setPhone}
            alternatePhone={alternatePhone}
            setAlternatePhone={setAlternatePhone}
            email={email}
            setEmail={setEmail}
          />

          {/* SECTION 3: Address Information */}
          <AddressSection
            isDark={isDark}
            address={address}
            setAddress={setAddress}
          />

          {/* SECTION 4: Account Settings */}
          <AccountSettingsSection
            isDark={isDark}
            dialogMode={dialogMode}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </ScrollView>

        {/* Screen Bottom Action Bar */}
        <AddParentFooter
          dialogMode={dialogMode}
          isDark={isDark}
          isSubmitting={isSubmitting}
          isFormValid={isFormValid}
          onBack={onBack}
          onSubmit={onSubmit}
          onReset={onReset}
        />
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={dobPickerOpen}
        onDismiss={() => setDobPickerOpen(false)}
        onSelectDate={(dateStr) => {
          if (setDateOfBirth) setDateOfBirth(dateStr);
          setDobPickerOpen(false);
        }}
        value={dateOfBirth}
        title="Select Date of Birth"
      />
    </View>
  );
}

// Backward-compatible alias export if imported elsewhere
export { AddParentScreen as AddParentDialog };

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  scrollContentTablet: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
});
