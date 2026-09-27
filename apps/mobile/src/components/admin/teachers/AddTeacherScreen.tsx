import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { AddTeacherHeader } from './form/AddTeacherHeader';
import { TeacherProfilePhotoSection } from './form/TeacherProfilePhotoSection';
import { TeacherPersonalInfoSection } from './form/TeacherPersonalInfoSection';
import { TeacherContactInfoSection } from './form/TeacherContactInfoSection';
import { TeacherProfessionalSection } from './form/TeacherProfessionalSection';
import { TeacherAccountSettingsSection } from './form/TeacherAccountSettingsSection';
import { AddTeacherFooter } from './form/AddTeacherFooter';

export interface AddTeacherScreenProps {
  onBack: () => void;
  colors: any;
  isDark?: boolean;
  dialogMode: 'create' | 'edit';
  name: string;
  setName: (val: string) => void;
  gender?: string;
  setGender?: (val: string) => void;
  dateOfBirth?: string;
  setDateOfBirth?: (val: string) => void;
  teacherId?: string;
  setTeacherId?: (val: string) => void;
  qualification: string;
  setQualification: (val: string) => void;
  experience: string;
  setExperience: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  alternatePhone?: string;
  setAlternatePhone?: (val: string) => void;
  address?: string;
  setAddress?: (val: string) => void;
  role?: string;
  subjects?: string;
  setSubjects?: (val: string) => void;
  joiningDate?: string;
  setJoiningDate?: (val: string) => void;
  status?: string;
  setStatus?: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReset?: () => void;
}

export function AddTeacherScreen({
  onBack,
  colors,
  isDark = false,
  dialogMode,
  name,
  setName,
  gender = 'male',
  setGender,
  dateOfBirth = '',
  setDateOfBirth,
  teacherId = '',
  setTeacherId,
  qualification,
  setQualification,
  experience,
  setExperience,
  email,
  setEmail,
  phone,
  setPhone,
  alternatePhone = '',
  setAlternatePhone,
  address = '',
  setAddress,
  role = 'Faculty Member',
  subjects = 'Mathematics',
  setSubjects,
  joiningDate = '',
  setJoiningDate,
  status = 'active',
  setStatus,
  password = '',
  setPassword,
  isSubmitting,
  onSubmit,
  onReset,
}: AddTeacherScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [joiningDatePickerOpen, setJoiningDatePickerOpen] = useState(false);

  // Validation: Name, email, qualification required; and password if creating
  const isFormValid = Boolean(
    name?.trim() &&
    email?.trim() &&
    qualification?.trim() &&
    (dialogMode === 'edit' || (password?.trim() && password.length >= 6))
  );

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header Bar */}
        <AddTeacherHeader
          onBack={onBack}
          dialogMode={dialogMode}
          colors={colors}
          isDark={isDark}
        />

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 0: Profile Photo */}
          <TeacherProfilePhotoSection
            isDark={isDark}
            name={name}
          />

          {/* SECTION 1: Personal Information */}
          <TeacherPersonalInfoSection
            isDark={isDark}
            name={name}
            setName={setName}
            gender={gender}
            setGender={setGender}
            dateOfBirth={dateOfBirth}
            onOpenDobPicker={() => setDobPickerOpen(true)}
            teacherId={teacherId}
            setTeacherId={setTeacherId}
            qualification={qualification}
            setQualification={setQualification}
            experience={experience}
            setExperience={setExperience}
            dialogMode={dialogMode}
          />

          {/* SECTION 2: Contact Information */}
          <TeacherContactInfoSection
            isDark={isDark}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            alternatePhone={alternatePhone}
            setAlternatePhone={setAlternatePhone}
            address={address}
            setAddress={setAddress}
          />

          {/* SECTION 3: Professional Information */}
          <TeacherProfessionalSection
            isDark={isDark}
            role={role}
            subjects={subjects}
            setSubjects={setSubjects || (() => {})}
            joiningDate={joiningDate}
            onOpenJoiningDatePicker={() => setJoiningDatePickerOpen(true)}
          />

          {/* SECTION 4: Account Settings */}
          <TeacherAccountSettingsSection
            isDark={isDark}
            dialogMode={dialogMode}
            status={status}
            setStatus={setStatus || (() => {})}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </ScrollView>

        {/* Bottom Screen Action Bar */}
        <AddTeacherFooter
          dialogMode={dialogMode}
          isDark={isDark}
          isSubmitting={isSubmitting}
          isFormValid={isFormValid}
          onBack={onBack}
          onSubmit={onSubmit}
          onReset={onReset}
        />
      </KeyboardAvoidingView>

      {/* Date of Birth Picker Modal */}
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

      {/* Date of Joining Picker Modal */}
      <DatePickerModal
        visible={joiningDatePickerOpen}
        onDismiss={() => setJoiningDatePickerOpen(false)}
        onSelectDate={(dateStr) => {
          if (setJoiningDate) setJoiningDate(dateStr);
          setJoiningDatePickerOpen(false);
        }}
        value={joiningDate}
        title="Select Date of Joining"
      />
    </View>
  );
}

// Backward-compatible alias
export { AddTeacherScreen as AddTeacherDialog };

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
});
