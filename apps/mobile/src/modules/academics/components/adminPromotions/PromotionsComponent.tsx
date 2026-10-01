import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { api } from '@/lib/api';
import { FAB } from 'react-native-paper';
import { ClassPickerDialog } from '@/modules/finance/components/adminFees/dialogs/ClassPickerDialog';
import { StudentPickerDialog } from '@/modules/finance/components/adminFees/dialogs/StudentPickerDialog';
import { CustomAlertDialog } from '@/modules/finance/components/adminFees/dialogs/CustomAlertDialog';

import {
  PromotionsState,
  ActiveTab,
  PromotionRecord,
  ClassOption,
  StudentOption,
  PromotionFormData,
  emptyForm,
} from './types';
import { getCurrentAcademicYear, getNextClass } from './utils';
import { PromotionsTable } from './PromotionsTable';
import { BulkPromoteTab } from './BulkPromoteTab';
import { GraduatedTab } from './GraduatedTab';
import { NewPromotionModal, RejectPromotionModal } from './PromotionModals';

type Action =
  | { type: 'SET_ACTIVE_TAB'; tab: ActiveTab }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_END' }
  | { type: 'SET_PROMOTIONS'; payload: PromotionRecord[] }
  | { type: 'SET_GRADUATIONS'; payload: PromotionRecord[] }
  | { type: 'SET_CLASSES'; payload: ClassOption[] }
  | { type: 'SET_STUDENTS'; payload: StudentOption[] }
  | { type: 'SET_FORM_STUDENTS'; payload: StudentOption[] }
  | { type: 'SET_BULK_STUDENTS'; payload: StudentOption[] }
  | { type: 'SET_GRAD_STUDENTS'; payload: StudentOption[] }
  | { type: 'SET_ACADEMIC_YEAR_FILTER'; year: string }
  | { type: 'SET_CLASS_FILTER'; classId: string }
  | { type: 'SET_STATUS_FILTER'; status: string }
  | { type: 'SET_DIALOG_OPEN'; open: boolean }
  | { type: 'SET_FORM'; form: PromotionFormData }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'SET_BULK_FROM_CLASS'; classId: string }
  | { type: 'SET_BULK_TO_CLASS'; classId: string }
  | { type: 'SET_BULK_ACADEMIC_YEAR'; year: string }
  | { type: 'SET_BULK_REMARKS'; remarks: string }
  | { type: 'SET_BULK_SELECTED_IDS'; ids: string[] }
  | { type: 'SET_BULK_SUBMITTING'; submitting: boolean }
  | { type: 'SET_GRAD_CLASS_ID'; classId: string }
  | { type: 'SET_GRAD_ACADEMIC_YEAR'; year: string }
  | { type: 'SET_GRAD_REMARKS'; remarks: string }
  | { type: 'SET_GRAD_SELECTED_IDS'; ids: string[] }
  | { type: 'SET_GRAD_SUBMITTING'; submitting: boolean }
  | { type: 'SET_REJECT_DIALOG_OPEN'; open: boolean; promotion?: PromotionRecord | null }
  | { type: 'SET_REJECT_REMARKS'; remarks: string }
  | { type: 'SET_REJECTING'; rejecting: boolean }
  | { type: 'SET_APPROVING_ID'; id: string | null };

const initialState: PromotionsState = {
  activeTab: 'bulk',
  promotions: [],
  graduations: [],
  classes: [],
  students: [],
  formStudents: [],
  bulkStudents: [],
  gradStudents: [],
  loading: false,
  academicYearFilter: 'all',
  classFilter: 'all',
  statusFilter: 'all',
  dialogOpen: false,
  form: { ...emptyForm, academicYear: getCurrentAcademicYear() },
  submitting: false,
  bulkDialogOpen: false,
  bulkFromClass: '',
  bulkToClass: '',
  bulkAcademicYear: getCurrentAcademicYear(),
  bulkRemarks: '',
  bulkSelectedIds: [],
  bulkSubmitting: false,
  gradClassId: '',
  gradAcademicYear: getCurrentAcademicYear(),
  gradRemarks: '',
  gradSelectedIds: [],
  gradSubmitting: false,
  rejectDialogOpen: false,
  rejectingPromotion: null,
  rejectRemarks: '',
  rejecting: false,
  approvingId: null,
};

function reducer(state: PromotionsState, action: Action): PromotionsState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_END':
      return { ...state, loading: false };
    case 'SET_PROMOTIONS':
      return { ...state, promotions: action.payload };
    case 'SET_GRADUATIONS':
      return { ...state, graduations: action.payload };
    case 'SET_CLASSES':
      return { ...state, classes: action.payload };
    case 'SET_STUDENTS':
      return { ...state, students: action.payload };
    case 'SET_FORM_STUDENTS':
      return { ...state, formStudents: action.payload };
    case 'SET_BULK_STUDENTS':
      return { ...state, bulkStudents: action.payload };
    case 'SET_GRAD_STUDENTS':
      return { ...state, gradStudents: action.payload };
    case 'SET_ACADEMIC_YEAR_FILTER':
      return { ...state, academicYearFilter: action.year };
    case 'SET_CLASS_FILTER':
      return { ...state, classFilter: action.classId };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.status };
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.open };
    case 'SET_FORM':
      return { ...state, form: action.form };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.submitting };
    case 'SET_BULK_FROM_CLASS':
      return { ...state, bulkFromClass: action.classId };
    case 'SET_BULK_TO_CLASS':
      return { ...state, bulkToClass: action.classId };
    case 'SET_BULK_ACADEMIC_YEAR':
      return { ...state, bulkAcademicYear: action.year };
    case 'SET_BULK_REMARKS':
      return { ...state, bulkRemarks: action.remarks };
    case 'SET_BULK_SUBMITTING':
      return { ...state, bulkSubmitting: action.submitting };
    case 'SET_BULK_SELECTED_IDS':
      return { ...state, bulkSelectedIds: action.ids };
    case 'SET_GRAD_CLASS_ID':
      return { ...state, gradClassId: action.classId };
    case 'SET_GRAD_ACADEMIC_YEAR':
      return { ...state, gradAcademicYear: action.year };
    case 'SET_GRAD_REMARKS':
      return { ...state, gradRemarks: action.remarks };
    case 'SET_GRAD_SELECTED_IDS':
      return { ...state, gradSelectedIds: action.ids };
    case 'SET_GRAD_SUBMITTING':
      return { ...state, gradSubmitting: action.submitting };
    case 'SET_REJECT_DIALOG_OPEN':
      return { ...state, rejectDialogOpen: action.open, rejectingPromotion: action.promotion || null };
    case 'SET_REJECT_REMARKS':
      return { ...state, rejectRemarks: action.remarks };
    case 'SET_REJECTING':
      return { ...state, rejecting: action.rejecting };
    case 'SET_APPROVING_ID':
      return { ...state, approvingId: action.id };
    default:
      return state;
  }
}

import { Dimensions, Animated } from 'react-native';

const TABS: ActiveTab[] = ['bulk', 'individual', 'graduated'];

export function PromotionsComponent() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [state, dispatch] = useReducer(reducer, initialState);

  // Modal pickers
  const [classPickerTarget, setClassPickerTarget] = React.useState<'filter' | 'formFrom' | 'formTo' | 'bulkFrom' | 'bulkTo' | 'grad' | null>(null);
  const [studentPickerVisible, setStudentPickerVisible] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState('');
  const [customAlert, setCustomAlert] = React.useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  /* ----- Data Fetching ----- */

  const fetchPromotions = useCallback(async () => {
    try {
      const params: Record<string, string> = { type: 'promotion', limit: '50' };
      if (state.academicYearFilter !== 'all') params.academicYear = state.academicYearFilter;
      if (state.classFilter !== 'all') params.classId = state.classFilter;
      if (state.statusFilter !== 'all') params.status = state.statusFilter;

      const res = await api.get<any>('/promotions', { params });
      dispatch({ type: 'SET_PROMOTIONS', payload: Array.isArray(res?.items) ? res.items : [] });
    } catch (err) {
      console.error('Failed to load promotions:', err);
    }
  }, [state.academicYearFilter, state.classFilter, state.statusFilter]);

  const fetchGraduations = useCallback(async () => {
    try {
      const params: Record<string, string> = { type: 'graduation', limit: '50' };
      if (state.academicYearFilter !== 'all') params.academicYear = state.academicYearFilter;

      const res = await api.get<any>('/promotions', { params });
      dispatch({ type: 'SET_GRADUATIONS', payload: Array.isArray(res?.items) ? res.items : [] });
    } catch (err) {
      console.error('Failed to load graduations:', err);
    }
  }, [state.academicYearFilter]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get<any>('/classes', { params: { mode: 'min' } });
      const items = Array.isArray(res) ? res : res?.items || [];
      dispatch({ type: 'SET_CLASSES', payload: items });
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    await Promise.all([fetchPromotions(), fetchGraduations(), fetchClasses()]);
    dispatch({ type: 'FETCH_END' });
  }, [fetchPromotions, fetchGraduations, fetchClasses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Individual Form Students Effect
  useEffect(() => {
    if (!state.form.fromClassId) {
      dispatch({ type: 'SET_FORM_STUDENTS', payload: [] });
      return;
    }
    let cancelled = false;
    api.get<any>('/students', { params: { classId: state.form.fromClassId, limit: '1000' } })
      .then(res => {
        if (cancelled) return;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        dispatch({ type: 'SET_FORM_STUDENTS', payload: items });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'SET_FORM_STUDENTS', payload: [] });
      });
    return () => { cancelled = true; };
  }, [state.form.fromClassId]);

  // 2. Bulk Promotion Students Effect
  useEffect(() => {
    if (!state.bulkFromClass) {
      dispatch({ type: 'SET_BULK_STUDENTS', payload: [] });
      dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: [] });
      return;
    }
    let cancelled = false;
    api.get<any>('/students', { params: { classId: state.bulkFromClass, limit: '1000' } })
      .then(res => {
        if (cancelled) return;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        dispatch({ type: 'SET_BULK_STUDENTS', payload: items });
        dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: items.map((s: any) => s.id) });
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: 'SET_BULK_STUDENTS', payload: [] });
          dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: [] });
        }
      });
    return () => { cancelled = true; };
  }, [state.bulkFromClass]);

  // 3. Graduated Tab Students Effect
  useEffect(() => {
    if (!state.gradClassId) {
      dispatch({ type: 'SET_GRAD_STUDENTS', payload: [] });
      dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: [] });
      return;
    }
    let cancelled = false;
    api.get<any>('/students', { params: { classId: state.gradClassId, limit: '1000' } })
      .then(res => {
        if (cancelled) return;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        dispatch({ type: 'SET_GRAD_STUDENTS', payload: items });
        dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: items.map((s: any) => s.id) });
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: 'SET_GRAD_STUDENTS', payload: [] });
          dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: [] });
        }
      });
    return () => { cancelled = true; };
  }, [state.gradClassId]);

  /* ----- Individual Promotion Actions ----- */

  const handleCreatePromotion = async () => {
    if (!state.form.studentId || !state.form.toClassId) return;
    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    try {
      await api.post('/promotions', {
        studentId: state.form.studentId,
        fromClassId: state.form.fromClassId,
        toClassId: state.form.toClassId,
        academicYear: state.form.academicYear,
        remarks: state.form.remarks || undefined,
      });
      showAlert('Success', 'Promotion request created successfully!');
      dispatch({ type: 'SET_DIALOG_OPEN', open: false });
      dispatch({ type: 'SET_FORM', form: { ...emptyForm, academicYear: getCurrentAcademicYear() } });
      fetchPromotions();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create promotion', 'error');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
    }
  };

  const handleApprove = async (promo: PromotionRecord) => {
    dispatch({ type: 'SET_APPROVING_ID', id: promo.id });
    try {
      await api.put('/promotions', {
        id: promo.id,
        status: 'approved',
      });
      showAlert('Approved', `Promotion for ${promo.studentName} approved!`);
      fetchPromotions();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to approve promotion', 'error');
    } finally {
      dispatch({ type: 'SET_APPROVING_ID', id: null });
    }
  };

  const handleReject = async () => {
    if (!state.rejectingPromotion) return;
    dispatch({ type: 'SET_REJECTING', rejecting: true });
    try {
      await api.put('/promotions', {
        id: state.rejectingPromotion.id,
        status: 'rejected',
        remarks: state.rejectRemarks || undefined,
      });
      showAlert('Rejected', `Promotion rejected.`);
      dispatch({ type: 'SET_REJECT_DIALOG_OPEN', open: false });
      dispatch({ type: 'SET_REJECT_REMARKS', remarks: '' });
      fetchPromotions();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to reject promotion', 'error');
    } finally {
      dispatch({ type: 'SET_REJECTING', rejecting: false });
    }
  };

  /* ----- Bulk Promotion Actions ----- */

  const handleBulkFromClassChange = (classId: string) => {
    dispatch({ type: 'SET_BULK_FROM_CLASS', classId });
    const autoNext = getNextClass(classId, state.classes);
    if (autoNext) {
      dispatch({ type: 'SET_BULK_TO_CLASS', classId: autoNext.id });
    } else {
      dispatch({ type: 'SET_BULK_TO_CLASS', classId: '' });
    }
  };

  const toggleBulkStudent = (id: string) => {
    const current = new Set(state.bulkSelectedIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: Array.from(current) });
  };

  const toggleAllBulk = () => {
    if (state.bulkSelectedIds.length === state.bulkStudents.length) {
      dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: [] });
    } else {
      dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: state.bulkStudents.map(s => s.id) });
    }
  };

  const handleBulkPromoteSubmit = async () => {
    if (!state.bulkFromClass || !state.bulkToClass || state.bulkSelectedIds.length === 0) return;
    dispatch({ type: 'SET_BULK_SUBMITTING', submitting: true });
    try {
      const res = await api.post<any>('/promotions', {
        bulk: true,
        fromClassId: state.bulkFromClass,
        toClassId: state.bulkToClass,
        academicYear: state.bulkAcademicYear,
        remarks: state.bulkRemarks || undefined,
        studentIds: state.bulkSelectedIds,
      });
      showAlert('Success', `${res?.created || state.bulkSelectedIds.length} students promoted successfully!`);
      dispatch({ type: 'SET_BULK_FROM_CLASS', classId: '' });
      dispatch({ type: 'SET_BULK_TO_CLASS', classId: '' });
      dispatch({ type: 'SET_BULK_SELECTED_IDS', ids: [] });
      dispatch({ type: 'SET_BULK_REMARKS', remarks: '' });
      fetchPromotions();
    } catch (err: any) {
      showAlert('Error', err.message || 'Bulk promotion failed', 'error');
    } finally {
      dispatch({ type: 'SET_BULK_SUBMITTING', submitting: false });
    }
  };

  /* ----- Graduation Actions ----- */

  const handleGradClassChange = (classId: string) => {
    dispatch({ type: 'SET_GRAD_CLASS_ID', classId });
  };

  const toggleGradStudent = (id: string) => {
    const current = new Set(state.gradSelectedIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: Array.from(current) });
  };

  const toggleAllGrad = () => {
    if (state.gradSelectedIds.length === state.gradStudents.length) {
      dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: [] });
    } else {
      dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: state.gradStudents.map(s => s.id) });
    }
  };

  const handleGraduateSubmit = async () => {
    if (!state.gradClassId || state.gradSelectedIds.length === 0) return;
    dispatch({ type: 'SET_GRAD_SUBMITTING', submitting: true });
    try {
      const res = await api.post<any>('/promotions', {
        graduation: true,
        fromClassId: state.gradClassId,
        academicYear: state.gradAcademicYear,
        remarks: state.gradRemarks || undefined,
        studentIds: state.gradSelectedIds,
      });
      showAlert('Success', `${res?.count || state.gradSelectedIds.length} students marked as graduated!`);
      dispatch({ type: 'SET_GRAD_CLASS_ID', classId: '' });
      dispatch({ type: 'SET_GRAD_SELECTED_IDS', ids: [] });
      dispatch({ type: 'SET_GRAD_REMARKS', remarks: '' });
      fetchGraduations();
    } catch (err: any) {
      showAlert('Error', err.message || 'Graduation failed', 'error');
    } finally {
      dispatch({ type: 'SET_GRAD_SUBMITTING', submitting: false });
    }
  };

  /* ----- Filtered Students for Picker ----- */

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return state.formStudents;
    const query = studentSearch.toLowerCase();
    return state.formStudents.filter(
      s => s.name.toLowerCase().includes(query) || (s.rollNumber && s.rollNumber.toLowerCase().includes(query))
    );
  }, [state.formStudents, studentSearch]);

  const classPickerOptions = useMemo(() => {
    return state.classes.map(c => ({ id: c.id, name: `${c.name}-${c.section} (Class ${c.classLevel})` }));
  }, [state.classes]);

  // Animated slide offset for tab switching
  const translateX = React.useRef(new Animated.Value(0)).current;
  const pillTranslateX = React.useRef(new Animated.Value(0)).current;

  const windowWidth = Dimensions.get('window').width;
  const containerPadding = 16;
  const tabBarPadding = 4;
  const availableTabBarWidth = windowWidth - (containerPadding * 2) - (tabBarPadding * 2);
  const singleTabWidth = availableTabBarWidth / 3;

  useEffect(() => {
    const targetIdx = TABS.indexOf(state.activeTab);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: -targetIdx * windowWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
      Animated.spring(pillTranslateX, {
        toValue: targetIdx * singleTabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
    ]).start();
  }, [state.activeTab, translateX, pillTranslateX, singleTabWidth, windowWidth]);

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Tab Selector Pills with Sliding Animated Indicator */}
        <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement, position: 'relative' }]}>
          {/* Animated Sliding Blue Pill Indicator */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: singleTabWidth,
              backgroundColor: '#007AFF',
              borderRadius: 8,
              transform: [{ translateX: pillTranslateX }],
            }}
          />
          {TABS.map((tab) => {
            const isActive = state.activeTab === tab;
            const labels: Record<ActiveTab, string> = {
              bulk: 'Bulk Transfer',
              individual: 'Individual',
              graduated: 'Graduated',
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, { backgroundColor: 'transparent' }]}
                onPress={() => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.tabText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                  {labels[tab]}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Smooth Animated Horizontal Container */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: windowWidth * 3,
            flex: 1,
            transform: [{ translateX }],
          }}
        >
          {/* Page 0: Bulk Transfer */}
          <View style={{ width: windowWidth, flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <BulkPromoteTab
                classes={state.classes}
                bulkFromClass={state.bulkFromClass}
                onFromClassChange={handleBulkFromClassChange}
                onClearFromClass={() => {
                  dispatch({ type: 'SET_BULK_FROM_CLASS', classId: '' });
                  dispatch({ type: 'SET_BULK_TO_CLASS', classId: '' });
                }}
                bulkToClass={state.bulkToClass}
                setBulkToClass={(id) => dispatch({ type: 'SET_BULK_TO_CLASS', classId: id })}
                onClearToClass={() => dispatch({ type: 'SET_BULK_TO_CLASS', classId: '' })}
                bulkAcademicYear={state.bulkAcademicYear}
                setBulkAcademicYear={(yr) => dispatch({ type: 'SET_BULK_ACADEMIC_YEAR', year: yr })}
                bulkRemarks={state.bulkRemarks}
                setBulkRemarks={(rem) => dispatch({ type: 'SET_BULK_REMARKS', remarks: rem })}
                bulkPreview={state.bulkStudents}
                bulkSelectedIds={state.bulkSelectedIds}
                onToggleBulkStudent={toggleBulkStudent}
                onToggleAllBulk={toggleAllBulk}
                onOpenClassPicker={(type) => setClassPickerTarget(type === 'from' ? 'bulkFrom' : 'bulkTo')}
                onSubmit={handleBulkPromoteSubmit}
                submitting={state.bulkSubmitting}
                colors={colors}
              />
            </ScrollView>
          </View>

          {/* Page 1: Individual */}
          <View style={{ width: windowWidth, flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <PromotionsTable
                promotions={state.promotions}
                loading={state.loading}
                approvingId={state.approvingId}
                colors={colors}
                onApprove={handleApprove}
                onReject={(promo) => dispatch({ type: 'SET_REJECT_DIALOG_OPEN', open: true, promotion: promo })}
                onNewPromotion={() => dispatch({ type: 'SET_DIALOG_OPEN', open: true })}
              />
            </ScrollView>
          </View>

          {/* Page 2: Graduated */}
          <View style={{ width: windowWidth, flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <GraduatedTab
                classes={state.classes}
                gradClassId={state.gradClassId}
                gradAcademicYear={state.gradAcademicYear}
                setGradAcademicYear={(yr) => dispatch({ type: 'SET_GRAD_ACADEMIC_YEAR', year: yr })}
                gradRemarks={state.gradRemarks}
                setGradRemarks={(rem) => dispatch({ type: 'SET_GRAD_REMARKS', remarks: rem })}
                gradPreview={state.gradStudents}
                gradSelectedIds={state.gradSelectedIds}
                onToggleGradStudent={toggleGradStudent}
                onToggleAll={toggleAllGrad}
                onOpenClassPicker={() => setClassPickerTarget('grad')}
                onSubmit={handleGraduateSubmit}
                submitting={state.gradSubmitting}
                graduations={state.graduations}
                loadingGraduations={state.loading}
                colors={colors}
              />
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* Floating Add Promotion FAB Button (Only visible on Individual tab) */}
      {state.activeTab === 'individual' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => dispatch({ type: 'SET_DIALOG_OPEN', open: true })}
          color="#FFF"
        />
      )}

      {/* Class Picker Dialog */}
      <ClassPickerDialog
        visible={classPickerTarget !== null}
        onDismiss={() => setClassPickerTarget(null)}
        colors={colors}
        classes={classPickerOptions as any}
        onSelectClass={(classId) => {
          if (classPickerTarget === 'formFrom') {
            dispatch({ type: 'SET_FORM', form: { ...state.form, fromClassId: classId, studentId: '' } });
            const autoTo = getNextClass(classId, state.classes);
            if (autoTo) dispatch({ type: 'SET_FORM', form: { ...state.form, fromClassId: classId, toClassId: autoTo.id, studentId: '' } });
          } else if (classPickerTarget === 'formTo') {
            dispatch({ type: 'SET_FORM', form: { ...state.form, toClassId: classId } });
          } else if (classPickerTarget === 'bulkFrom') {
            handleBulkFromClassChange(classId);
          } else if (classPickerTarget === 'bulkTo') {
            dispatch({ type: 'SET_BULK_TO_CLASS', classId });
          } else if (classPickerTarget === 'grad') {
            handleGradClassChange(classId);
          }
          setClassPickerTarget(null);
        }}
      />

      {/* Student Picker Dialog */}
      <StudentPickerDialog
        visible={studentPickerVisible}
        onDismiss={() => setStudentPickerVisible(false)}
        colors={colors}
        studentSearch={studentSearch}
        setStudentSearch={setStudentSearch}
        filteredStudents={filteredStudents as any}
        onSelectStudent={(studentId) => {
          dispatch({ type: 'SET_FORM', form: { ...state.form, studentId } });
          setStudentPickerVisible(false);
        }}
      />

      {/* New Promotion Modal */}
      <NewPromotionModal
        visible={state.dialogOpen}
        onDismiss={() => dispatch({ type: 'SET_DIALOG_OPEN', open: false })}
        form={state.form}
        setForm={(form) => dispatch({ type: 'SET_FORM', form: typeof form === 'function' ? form(state.form) : form })}
        classes={state.classes}
        students={state.formStudents}
        onOpenClassPicker={(type) => setClassPickerTarget(type === 'from' ? 'formFrom' : 'formTo')}
        onOpenStudentPicker={() => setStudentPickerVisible(true)}
        onSubmit={handleCreatePromotion}
        submitting={state.submitting}
        colors={colors}
      />

      {/* Reject Modal */}
      <RejectPromotionModal
        visible={state.rejectDialogOpen}
        onDismiss={() => dispatch({ type: 'SET_REJECT_DIALOG_OPEN', open: false })}
        studentName={state.rejectingPromotion?.studentName}
        remarks={state.rejectRemarks}
        setRemarks={(rem) => dispatch({ type: 'SET_REJECT_REMARKS', remarks: rem })}
        onSubmit={handleReject}
        submitting={state.rejecting}
        colors={colors}
      />

      {/* Alert Dialog */}
      <CustomAlertDialog
        visible={customAlert.visible}
        onDismiss={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        colors={colors}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
});
