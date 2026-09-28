'use client';

import { ClassOption, SubjectOption } from './types';
import { WizardHeader } from './wizard/WizardHeader';
import { Step1BasicDetails } from './wizard/Step1BasicDetails';
import { Step2Subjects } from './wizard/Step2Subjects';
import { Step3Teachers } from './wizard/Step3Teachers';
import { Step4Review } from './wizard/Step4Review';
import { SuccessModal } from './wizard/SuccessModal';
import { useCreateExamWizard } from './wizard/useCreateExamWizard';

interface CreateExamWizardProps {
  onCancel: () => void;
  classes: ClassOption[];
  subjects: SubjectOption[];
  academicYears: any[];
  currentAcademicYear: string;
  onSuccess: () => void;
  teachers?: any[];
  initialExam?: any;
}

export function CreateExamWizard({
  onCancel,
  classes,
  subjects,
  academicYears,
  currentAcademicYear,
  onSuccess,
  teachers = [],
  initialExam,
}: CreateExamWizardProps) {
  const wizard = useCreateExamWizard({
    classes,
    subjects,
    currentAcademicYear,
    teachers,
    onSuccess,
    initialExam,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-300 pb-12">
      <WizardHeader
        currentStep={wizard.currentStep}
        onCancel={onCancel}
        onStepClick={(step) => wizard.setCurrentStep(step)}
        isEdit={wizard.isEdit}
      />

      {/* STEP 1: Basic Details */}
      {wizard.currentStep === 1 && (
        <Step1BasicDetails
          examName={wizard.examName}
          setExamName={wizard.setExamName}
          examType={wizard.examType}
          setExamType={wizard.setExamType}
          selectionMode={wizard.selectionMode}
          setSelectionMode={wizard.setSelectionMode}
          selectedGrade={wizard.selectedGrade}
          handleSelectGrade={wizard.handleSelectGrade}
          selectedClassIds={wizard.selectedClassIds}
          handleSelectSectionClass={wizard.handleSelectSectionClass}
          classes={classes}
          gradeGroups={wizard.gradeGroups}
          selectedClasses={wizard.selectedClasses}
          academicYear={wizard.academicYear}
          setAcademicYear={wizard.setAcademicYear}
          academicYears={academicYears}
          startDate={wizard.startDate}
          handleStartDateChange={wizard.handleStartDateChange}
          endDate={wizard.endDate}
          setEndDate={wizard.setEndDate}
          isPastDate={wizard.isPastDate}
          isEndDateDisabled={wizard.isEndDateDisabled}
          description={wizard.description}
          setDescription={wizard.setDescription}
          onCancel={onCancel}
          onNext={() => {
            if (wizard.validateStep1()) wizard.setCurrentStep(2);
          }}
        />
      )}

      {/* STEP 2: Select Subjects & Timetable */}
      {wizard.currentStep === 2 && (
        <Step2Subjects
          selectedClasses={wizard.selectedClasses}
          distinctSubjects={wizard.distinctSubjects}
          currentBulkRows={wizard.currentBulkRows}
          selectedCount={wizard.selectedCount}
          toggleAllSubjects={wizard.toggleAllSubjects}
          toggleSelectSubject={wizard.toggleSelectSubject}
          updateSubjectField={wizard.updateSubjectField}
          isSubjectDateDisabled={wizard.isSubjectDateDisabled}
          onBack={() => wizard.setCurrentStep(1)}
          onCancel={onCancel}
          onNext={() => {
            if (wizard.validateStep2()) wizard.setCurrentStep(3);
          }}
        />
      )}

      {/* STEP 3: Assign Teachers */}
      {wizard.currentStep === 3 && (
        <Step3Teachers
          selectedClasses={wizard.selectedClasses}
          subjects={subjects}
          currentBulkRows={wizard.currentBulkRows}
          teachers={teachers}
          classTeacherAssignments={wizard.classTeacherAssignments}
          setClassTeacherAssignments={wizard.setClassTeacherAssignments}
          onBack={() => wizard.setCurrentStep(2)}
          onCancel={onCancel}
          onNext={() => wizard.setCurrentStep(4)}
        />
      )}

      {/* STEP 4: Review & Create */}
      {wizard.currentStep === 4 && (
        <Step4Review
          examName={wizard.examName}
          selectedClasses={wizard.selectedClasses}
          selectedGrade={wizard.selectedGrade}
          academicYear={wizard.academicYear}
          startDate={wizard.startDate}
          endDate={wizard.endDate}
          currentBulkRows={wizard.currentBulkRows}
          submitting={wizard.submitting}
          onBack={() => wizard.setCurrentStep(3)}
          onCancel={onCancel}
          onSubmit={wizard.handleFinalSubmit}
          isEdit={wizard.isEdit}
        />
      )}

      {/* Success Modal */}
      {wizard.createdSummary && (
        <SuccessModal summary={wizard.createdSummary} onSuccess={onSuccess} />
      )}
    </div>
  );
}
