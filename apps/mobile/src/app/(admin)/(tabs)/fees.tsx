import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Sub-components
import { FeeStatusTab } from '@/modules/finance/components/adminFees/FeeStatusTab';
import { StudentFeeStatusTab } from '@/modules/finance/components/adminFees/StudentFeeStatusTab';
import { CollectFeeTab } from '@/modules/finance/components/adminFees/CollectFeeTab';
import { ReceiptsTab } from '@/modules/finance/components/adminFees/ReceiptsTab';
import { ConcessionsTab } from '@/modules/finance/components/adminFees/ConcessionsTab';
import { SetFeesTab } from '@/modules/finance/components/adminFees/SetFeesTab';
import { CategoriesTab } from '@/modules/finance/components/adminFees/CategoriesTab';
import { TransportTab } from '@/modules/finance/components/adminFees/TransportTab';
import { Skeleton } from '@/components/Skeleton';

// Dialog components
import { StudentPickerDialog } from '@/modules/finance/components/adminFees/dialogs/StudentPickerDialog';
import { CategoryPickerDialog } from '@/modules/finance/components/adminFees/dialogs/CategoryPickerDialog';
import { ClassPickerDialog } from '@/modules/finance/components/adminFees/dialogs/ClassPickerDialog';
import { AcademicYearPickerDialog } from '@/modules/finance/components/adminFees/dialogs/AcademicYearPickerDialog';
import { ConcessionDialog } from '@/modules/finance/components/adminFees/dialogs/ConcessionDialog';
import { TransactionSuccessDialog } from '@/modules/finance/components/adminFees/dialogs/TransactionSuccessDialog';
import { AddManualFeeDialog } from '@/modules/finance/components/adminFees/dialogs/AddManualFeeDialog';
import { DueDateCalendarPickerDialog } from '@/modules/finance/components/adminFees/dialogs/DueDateCalendarPickerDialog';
import { StructureDialog } from '@/modules/finance/components/adminFees/dialogs/StructureDialog';
import { CategoryDialog } from '@/modules/finance/components/adminFees/dialogs/CategoryDialog';
import { EditStructureDialog } from '@/modules/finance/components/adminFees/dialogs/EditStructureDialog';
import { AssignDialog } from '@/modules/finance/components/adminFees/dialogs/AssignDialog';
import { ReceiptDetailDialog } from '@/modules/finance/components/adminFees/dialogs/ReceiptDetailDialog';
import { CustomAlertDialog } from '@/modules/finance/components/adminFees/dialogs/CustomAlertDialog';

// Hooks & Styles
import { useFees, TabType } from '@/modules/finance/components/adminFees/useFees';
import { styles } from '@/modules/finance/components/adminFees/fees.styles';

import { useAuth } from '@/store/auth-context';

export default function FeesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Active tab optimization: only render the active tab to prevent lag from mounting multiple heavy lists
  
  const {
    colors,
    activeTab,
    isLoading,
    isRefreshing,
    layoutWidth,
    scrollX,
    scrollViewRef,
    tabBarScrollRef,
    tabLayouts,
    setTabLayouts,
    students,
    classes,
    feeItems,
    concessions,
    structures,
    categories,
    academicYears,
    totalCollected,
    pendingAmount,
    totalInvoiced,
    receiptSearch,
    setReceiptSearch,
    studentSearch,
    setStudentSearch,
    studentPickerVisible,
    setStudentPickerVisible,
    categoryPickerVisible,
    setCategoryPickerVisible,
    classPickerVisible,
    setClassPickerVisible,
    yearPickerVisible,
    setYearPickerVisible,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    setSelectedStudent,
    collectClassId,
    setCollectClassId,
    studentFees,
    setStudentFees,
    selectedFeeIds,
    setSelectedFeeIds,
    paymentMethod,
    setPaymentMethod,
    payAmount,
    setPayAmount,
    submittingPayment,
    monthlyStats,
    loadingStats,
    siblings,
    setSiblings,
    studentConcessions,
    setStudentConcessions,
    loadingStudentDetails,
    successVisible,
    setSuccessVisible,
    successReceiptNumber,
    successPaidAmount,
    addManualFeeVisible,
    setAddManualFeeVisible,
    manualCategory,
    setManualCategory,
    manualCustomType,
    setManualCustomType,
    manualAmount,
    setManualAmount,
    manualDueDate,
    setManualDueDate,
    manualRemarks,
    setManualRemarks,
    manualMarkPaid,
    setManualMarkPaid,
    manualPaymentMethod,
    setManualPaymentMethod,
    submittingManualFee,
    dueDatePickerVisible,
    setDueDatePickerVisible,
    concessionStudentId,
    setConcessionStudentId,
    concessionCategoryId,
    setConcessionCategoryId,
    concessionType,
    setConcessionType,
    concessionAmount,
    setConcessionAmount,
    concessionReason,
    setConcessionReason,
    concessionDialogVisible,
    setConcessionDialogVisible,
    structureCategoryId,
    setStructureCategoryId,
    structureClassId,
    setStructureClassId,
    structureAmount,
    setStructureAmount,
    structureYear,
    setStructureYear,
    structureDialogVisible,
    setStructureDialogVisible,
    setFeeYearFilter,
    setSetFeeYearFilter,
    setFeeCatFilter,
    setSetFeeCatFilter,
    editStructureDialogVisible,
    setEditStructureDialogVisible,
    editingStructureItem,
    setEditingStructureItem,
    editingStructureAmount,
    setEditingStructureAmount,
    savingStructure,
    assignDialogVisible,
    setAssignDialogVisible,
    assignStructureItem,
    assignLoading,
    assignData,
    assignSelectedIds,
    setAssignSelectedIds,
    assignSearch,
    setAssignSearch,
    assignSaving,
    setParentModalToRestore,
    categoryName,
    setCategoryName,
    categoryCode,
    setCategoryCode,
    categoryDesc,
    setCategoryDesc,
    categoryFreq,
    setCategoryFreq,
    categoryDialogVisible,
    setCategoryDialogVisible,
    selectedReceipt,
    setSelectedReceipt,
    receiptDetailVisible,
    setReceiptDetailVisible,
    customAlert,
    setCustomAlert,
    showCustomAlert,
    canCreateFees,
    canEditFees,
    canDeleteFees,
    tabs,
    handleTabPress,
    handleMomentumScrollEnd,
    onLayout,
    indicatorTranslateX,
    indicatorWidth,
    parentScrollEnabled,
    setParentScrollEnabled,
    fetchStudentPendingFees,
    loadTabData,
    handleRefresh,
    handleSelectSibling,
    handleAddManualFee,
    calculatePayableTotal,
    handleMakePayment,
    resetConcessionForm,
    resetStructureForm,
    resetCategoryForm,
    restoreParentModal,
    handleAddConcession,
    handleAddStructure,
    handleEditStructureSave,
    fetchFeeAssignment,
    handleAssignSave,
    handleAddCategory,
    handleDeleteStructure,
    handleDeleteConcession,
    filteredReceipts,
    filteredStudents,
    collectionPercentage,
    loadMoreStatusData,
    hasMoreStatus,
    loadMoreReceipts,
    hasMoreReceipts,
    isLoadingMoreReceipts,
    allFees,
    setAllFees,
    studentReceipts,
    setStudentReceipts,
    fetchStudentCompleteStatus,
    loadMoreStudents,
    isLoadingStudents,
    feeStatusClassId,
    setFeeStatusClassId,
    feeStatusSearchQuery,
    setFeeStatusSearchQuery
  } = useFees();

  const renderTabSkeleton = useCallback((tabId: TabType) => {
    if (tabId === 'status') {
      return (
        <View style={{ gap: 16 }}>
          {/* Stats Cards Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, height: 100, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16 }}>
              <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
              <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={10} />
            </View>
            <View style={{ flex: 1, height: 100, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16 }}>
              <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
              <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={10} />
            </View>
          </View>
          <View style={{ height: 100, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16 }}>
            <Skeleton width="30%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={10} />
          </View>

          {/* List Skeleton */}
          <ThemedText style={{ fontWeight: 'bold', marginTop: 10 }}>FEE STRUCTURE BREAKDOWN</ThemedText>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ height: 70, borderRadius: 12, backgroundColor: colors.backgroundElement, padding: 16, gap: 10, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="20%" height={14} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width="30%" height={10} />
                <Skeleton width="15%" height={10} />
              </View>
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'collect') {
      return (
        <View style={{ gap: 16 }}>
          {/* Monthly stats loader instead of skeleton */}
          <View style={{ height: 90, backgroundColor: colors.backgroundElement, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
          {/* Selection placeholder */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: colors.backgroundElement }} />
            <View style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: colors.backgroundElement }} />
          </View>
          {/* Student row list skeletons for full screen */}
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ height: 60, borderRadius: 12, backgroundColor: colors.backgroundElement, padding: 12, justifyContent: 'center', gap: 8 }}>
              <Skeleton width="60%" height={12} />
              <Skeleton width="35%" height={8} />
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'fee-status') {
      return (
        <View style={{ gap: 16, padding: 16, borderRadius: 16, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected }}>
          {/* Header */}
          <View style={{ gap: 8, marginBottom: 12 }}>
            <Skeleton width="50%" height={20} />
            <Skeleton width="80%" height={12} />
          </View>
          {/* Class Filters */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={80} height={32} borderRadius={16} />
            <Skeleton width={80} height={32} borderRadius={16} />
          </View>
          {/* Search Bar */}
          <Skeleton width="100%" height={44} borderRadius={10} style={{ marginBottom: 12 }} />
          {/* Student List */}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected }}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={10} />
              </View>
              <Skeleton width={16} height={16} />
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'receipts') {
      return (
        <View style={{ gap: 16 }}>
          {/* Search bar skeleton */}
          <View style={{ height: 46, borderRadius: 12, backgroundColor: colors.backgroundElement, justifyContent: 'center', paddingHorizontal: 16 }}>
            <Skeleton width="40%" height={14} />
          </View>
          {/* Receipts list */}
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ height: 85, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="35%" height={14} />
                <Skeleton width="18%" height={18} borderRadius={6} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 4, flex: 1 }}>
                  <Skeleton width="60%" height={12} />
                  <Skeleton width="40%" height={10} />
                </View>
                <Skeleton width="22%" height={16} />
              </View>
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'concessions') {
      return (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="25%" height={32} borderRadius={8} />
          </View>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', height: 80, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 14, alignItems: 'center', gap: 12 }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="45%" height={10} />
              </View>
              <Skeleton width="18%" height={20} borderRadius={6} />
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'structures') {
      return (
        <View style={{ gap: 16 }}>
          {/* Filters row skeleton */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: colors.backgroundElement }} />
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: colors.backgroundElement }} />
            <View style={{ flex: 1, height: 40, borderRadius: 8, backgroundColor: colors.backgroundElement }} />
          </View>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ height: 110, borderRadius: 18, backgroundColor: colors.backgroundElement, padding: 16, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Skeleton width={32} height={20} borderRadius={4} />
                  <Skeleton width="50%" height={14} />
                </View>
                <Skeleton width="20%" height={12} />
              </View>
              <View style={{ height: 1, backgroundColor: colors.backgroundSelected, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="35%" height={22} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Skeleton width={28} height={28} borderRadius={14} />
                  <Skeleton width={28} height={28} borderRadius={14} />
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    } else if (tabId === 'categories') {
      return (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="30%" height={16} />
            <Skeleton width="25%" height={32} borderRadius={8} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={{ width: '48%', height: 100, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 14, justifyContent: 'space-between' }}>
                <View style={{ gap: 4 }}>
                  <Skeleton width="40%" height={10} />
                  <Skeleton width="80%" height={14} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton width="50%" height={10} />
                  <Skeleton width={18} height={18} borderRadius={9} />
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    } else if (tabId === 'transport') {
      return (
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="35%" height={16} />
            <Skeleton width="28%" height={32} borderRadius={8} />
          </View>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={{ height: 95, borderRadius: 16, backgroundColor: colors.backgroundElement, padding: 16, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' }} />
                  <Skeleton width="55%" height={14} />
                </View>
                <Skeleton width="25%" height={16} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="45%" height={10} />
                <Skeleton width="30%" height={10} />
              </View>
            </View>
          ))}
        </View>
      );
    }
  }, [colors]);

  return (
    <ThemedView style={styles.container} safeAreaTop onLayout={onLayout}>
      {/* Custom Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.backgroundSelected }]} 
          onPress={() => router.push('/(admin)/(tabs)/more')}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Fee Management</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs Selector Bar */}
      <View style={[styles.tabBarBg, { borderBottomColor: colors.backgroundSelected }]}>
        <ScrollView 
          ref={tabBarScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabScrollContainer}
        >
          <View style={{ flexDirection: 'row', position: 'relative', height: '100%', alignItems: 'center' }}>
            {tabs.map((tab) => {
              const isSel = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    handleTabPress(tab.id);
                  }}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts(prev => ({ ...prev, [tab.id]: { x, width } }));
                  }}
                  style={styles.tabButton}
                >
                  <Ionicons name={tab.icon as any} size={15} color={isSel ? '#007AFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                  <ThemedText 
                    numberOfLines={1}
                    style={[styles.tabLabel, { color: isSel ? '#007AFF' : colors.textSecondary, fontWeight: isSel ? 'bold' : 'normal' }]}
                  >
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
            {tabs.every(t => tabLayouts[t.id]) && (
              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  height: 3,
                  backgroundColor: '#007AFF',
                  borderRadius: 1.5,
                  width: indicatorWidth,
                  transform: [{ translateX: indicatorTranslateX }],
                }}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={parentScrollEnabled}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {tabs.map((tab) => {
          const isMounted = activeTab === tab.id;
          return (
            <View key={tab.id} style={{ width: layoutWidth, flex: 1 }}>
              {!isMounted ? null : tab.id === 'status' ? (
                (isLoading || isRefreshing) ? (
                  <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
                    }
                  >
                    {renderTabSkeleton(tab.id)}
                  </ScrollView>
                ) : (
                  <FeeStatusTab
                    colors={colors}
                    totalCollected={totalCollected}
                    pendingAmount={pendingAmount}
                    totalInvoiced={totalInvoiced}
                    collectionPercentage={collectionPercentage}
                    feeItems={feeItems}
                    onEndReached={loadMoreStatusData}
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                  />
                )
              ) : tab.id === 'receipts' ? (
                (isLoading || isRefreshing) ? (
                  <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
                    }
                  >
                    {renderTabSkeleton(tab.id)}
                  </ScrollView>
                ) : (
                  <View style={{ flex: 1, padding: 16 }}>
                    <ReceiptsTab
                      colors={colors}
                      receiptSearch={receiptSearch}
                      setReceiptSearch={setReceiptSearch}
                      filteredReceipts={filteredReceipts}
                      setSelectedReceipt={setSelectedReceipt}
                      setReceiptDetailVisible={setReceiptDetailVisible}
                      onEndReached={loadMoreReceipts}
                      isLoadingMore={isLoadingMoreReceipts}
                      isRefreshing={isRefreshing}
                      onRefresh={handleRefresh}
                      />
                  </View>
                )
              ) : tab.id === 'fee-status' ? (
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
                  }
                >
                  {(isLoading || isRefreshing) ? renderTabSkeleton(tab.id) : (
                      <StudentFeeStatusTab
                        colors={colors}
                        selectedStudentId={selectedStudentId}
                        selectedStudent={selectedStudent}
                        students={students}
                        classes={classes}
                        allFees={allFees}
                        studentReceipts={studentReceipts}
                        siblings={siblings}
                        concessions={studentConcessions}
                        loadingStudentDetails={loadingStudentDetails}
                        onSelectStudent={(studentId) => {
                          setSelectedStudentId(studentId);
                          fetchStudentCompleteStatus(studentId);
                        }}
                        onSelectSibling={handleSelectSibling}
                        onChangeStudent={() => {
                          setSelectedStudentId('');
                          setSelectedStudent(null);
                          setAllFees([]);
                          setStudentReceipts([]);
                          setSiblings([]);
                          setStudentConcessions([]);
                        }}
                        setParentScrollEnabled={setParentScrollEnabled}
                        classFilter={feeStatusClassId}
                        setClassFilter={setFeeStatusClassId}
                        searchQuery={feeStatusSearchQuery}
                        setSearchQuery={setFeeStatusSearchQuery}
                        onLoadMoreStudents={loadMoreStudents}
                        isLoadingStudents={isLoadingStudents}
                      />
                  )}
                </ScrollView>
              ) : (
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
                  }
                >
                  {(isLoading || isRefreshing) ? renderTabSkeleton(tab.id) : (
                    <>
                      {tab.id === 'collect' && (
                        <CollectFeeTab
                        colors={colors}
                        selectedStudentId={selectedStudentId}
                        selectedStudent={selectedStudent}
                        students={students}
                        studentFees={studentFees}
                        selectedFeeIds={selectedFeeIds}
                        setSelectedFeeIds={setSelectedFeeIds}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        payAmount={payAmount}
                        setPayAmount={setPayAmount}
                        submittingPayment={submittingPayment}
                        setStudentPickerVisible={setStudentPickerVisible}
                        calculatePayableTotal={calculatePayableTotal}
                        handleMakePayment={handleMakePayment}
                        collectClassId={collectClassId}
                        setCollectClassId={setCollectClassId}
                        classes={classes}
                        setClassPickerVisible={setClassPickerVisible}
                        monthlyStats={monthlyStats}
                        loadingStats={loadingStats}
                        siblings={siblings}
                        concessions={studentConcessions}
                        loadingStudentDetails={loadingStudentDetails}
                        onSelectSibling={handleSelectSibling}
                        onChangeStudent={() => {
                          setSelectedStudentId('');
                          setSelectedStudent(null);
                          setStudentFees([]);
                          setSiblings([]);
                          setStudentConcessions([]);
                        }}
                        onOpenManualFee={() => setAddManualFeeVisible(true)}
                      />
                    )}

                    {tab.id === 'concessions' && (
                      <ConcessionsTab
                        colors={colors}
                        concessions={concessions}
                        setConcessionDialogVisible={() => {
                          if (!canCreateFees) {
                            showCustomAlert('Permission Denied', 'You do not have permission to add concessions.', 'error');
                            return;
                          }
                          resetConcessionForm();
                          setConcessionDialogVisible(true);
                        }}
                        resetConcessionForm={resetConcessionForm}
                        handleDeleteConcession={handleDeleteConcession}
                      />
                    )}

                    {tab.id === 'structures' && (
                      <SetFeesTab
                        colors={colors}
                        structures={structures}
                        categories={categories}
                        academicYears={academicYears}
                        setStructureDialogVisible={() => {
                          if (!canCreateFees) {
                            showCustomAlert('Permission Denied', 'You do not have permission to configure class fees.', 'error');
                            return;
                          }
                          resetStructureForm();
                          setStructureDialogVisible(true);
                        }}
                        resetStructureForm={resetStructureForm}
                        handleDeleteStructure={handleDeleteStructure}
                        canCreate={canCreateFees}
                        canEdit={canEditFees}
                        canDelete={canDeleteFees}
                        yearFilter={setFeeYearFilter}
                        setYearFilter={setSetFeeYearFilter}
                        catFilter={setFeeCatFilter}
                        setCatFilter={setSetFeeCatFilter}
                        onAssign={fetchFeeAssignment}
                        onEdit={(s) => {
                          setEditingStructureItem(s);
                          setEditingStructureAmount(String(s.amount));
                          setEditStructureDialogVisible(true);
                        }}
                      />
                    )}

                    {tab.id === 'categories' && (
                      <CategoriesTab
                        colors={colors}
                        categories={categories}
                        setCategoryDialogVisible={() => {
                          if (!canCreateFees) {
                            showCustomAlert('Permission Denied', 'You do not have permission to create fee categories.', 'error');
                            return;
                          }
                          resetCategoryForm();
                          setCategoryDialogVisible(true);
                        }}
                        resetCategoryForm={resetCategoryForm}
                      />
                    )}

                    {tab.id === 'transport' && (
                      <TransportTab
                        colors={colors}
                        classes={classes}
                        students={students}
                        showCustomAlert={showCustomAlert}
                        onLoadMoreStudents={loadMoreStudents}
                        isLoadingStudents={isLoadingStudents}
                      />
                    )}
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
            </View>
          );
        })}
      </Animated.ScrollView>

      <StudentPickerDialog
        visible={studentPickerVisible}
        onDismiss={() => {
          setStudentPickerVisible(false);
          restoreParentModal();
        }}
        colors={colors}
        studentSearch={studentSearch}
        setStudentSearch={setStudentSearch}
        filteredStudents={filteredStudents}
        onEndReached={loadMoreStudents}
        isLoadingMore={isLoadingStudents}
        onSelectStudent={(studentId) => {
          if (activeTab === 'collect') {
            setSelectedStudentId(studentId);
            fetchStudentPendingFees(studentId);
          } else if (activeTab === 'fee-status') {
            setSelectedStudentId(studentId);
            fetchStudentCompleteStatus(studentId);
          } else if (activeTab === 'concessions') {
            setConcessionStudentId(studentId);
          }
          setStudentPickerVisible(false);
          setStudentSearch('');
          restoreParentModal();
        }}
      />

      <CategoryPickerDialog
        visible={categoryPickerVisible}
        onDismiss={() => {
          setCategoryPickerVisible(false);
          if (activeTab === 'collect') {
            setAddManualFeeVisible(true);
          } else {
            restoreParentModal();
          }
        }}
        colors={colors}
        activeTab={activeTab}
        categories={categories}
        onSelectCategory={(categoryId) => {
          if (activeTab === 'concessions') {
            setConcessionCategoryId(categoryId);
          } else if (activeTab === 'structures') {
            setStructureCategoryId(categoryId);
          } else if (activeTab === 'collect') {
            setManualCategory(categoryId);
            setAddManualFeeVisible(true);
          }
          setCategoryPickerVisible(false);
          if (activeTab !== 'collect') {
            restoreParentModal();
          }
        }}
        onCustomSelect={() => {
          setManualCategory('custom');
          setCategoryPickerVisible(false);
          setAddManualFeeVisible(true);
        }}
      />

      <ClassPickerDialog
        visible={classPickerVisible}
        onDismiss={() => {
          setClassPickerVisible(false);
          restoreParentModal();
        }}
        colors={colors}
        classes={classes}
        onSelectClass={(classId) => {
          if (activeTab === 'collect') {
            setCollectClassId(classId);
            setSelectedStudentId('');
            setStudentFees([]);
          } else {
            setStructureClassId(classId);
          }
          setClassPickerVisible(false);
          restoreParentModal();
        }}
      />

      <AcademicYearPickerDialog
        visible={yearPickerVisible}
        onDismiss={() => {
          setYearPickerVisible(false);
          restoreParentModal();
        }}
        colors={colors}
        academicYears={academicYears}
        onSelectYear={(yearName) => {
          setStructureYear(yearName);
          setYearPickerVisible(false);
          restoreParentModal();
        }}
      />

      <ConcessionDialog
        visible={concessionDialogVisible}
        onDismiss={() => setConcessionDialogVisible(false)}
        colors={colors}
        concessionStudentId={concessionStudentId}
        concessionCategoryId={concessionCategoryId}
        concessionType={concessionType}
        setConcessionType={setConcessionType}
        concessionAmount={concessionAmount}
        setConcessionAmount={setConcessionAmount}
        concessionReason={concessionReason}
        setConcessionReason={setConcessionReason}
        students={students}
        categories={categories}
        onTriggerStudentPicker={() => {
          setParentModalToRestore('concession');
          setConcessionDialogVisible(false);
          setStudentPickerVisible(true);
        }}
        onTriggerCategoryPicker={() => {
          setParentModalToRestore('concession');
          setConcessionDialogVisible(false);
          setCategoryPickerVisible(true);
          if (categories.length === 0) loadTabData('categories');
        }}
        onSubmit={handleAddConcession}
      />

      <TransactionSuccessDialog
        visible={successVisible}
        onDismiss={() => setSuccessVisible(false)}
        colors={colors}
        successReceiptNumber={successReceiptNumber}
        successPaidAmount={successPaidAmount}
      />

      <AddManualFeeDialog
        visible={addManualFeeVisible}
        onDismiss={() => setAddManualFeeVisible(false)}
        colors={colors}
        manualCategory={manualCategory}
        manualCustomType={manualCustomType}
        setManualCustomType={setManualCustomType}
        manualAmount={manualAmount}
        setManualAmount={setManualAmount}
        manualDueDate={manualDueDate}
        manualRemarks={manualRemarks}
        setManualRemarks={setManualRemarks}
        manualMarkPaid={manualMarkPaid}
        setManualMarkPaid={setManualMarkPaid}
        manualPaymentMethod={manualPaymentMethod}
        setManualPaymentMethod={setManualPaymentMethod}
        categories={categories}
        submittingManualFee={submittingManualFee}
        onTriggerCategoryPicker={() => {
          setAddManualFeeVisible(false);
          setCategoryPickerVisible(true);
          if (categories.length === 0) loadTabData('categories');
        }}
        onTriggerDatePicker={() => setDueDatePickerVisible(true)}
        onSubmit={handleAddManualFee}
      />

      <DueDateCalendarPickerDialog
        visible={dueDatePickerVisible}
        onDismiss={() => setDueDatePickerVisible(false)}
        colors={colors}
        manualDueDate={manualDueDate}
        onSelectDate={(dateString) => {
          setManualDueDate(dateString);
          setDueDatePickerVisible(false);
        }}
      />

      <StructureDialog
        visible={structureDialogVisible}
        onDismiss={() => setStructureDialogVisible(false)}
        colors={colors}
        structureCategoryId={structureCategoryId}
        structureClassId={structureClassId}
        structureAmount={structureAmount}
        setStructureAmount={setStructureAmount}
        structureYear={structureYear}
        categories={categories}
        classes={classes}
        onTriggerCategoryPicker={() => {
          setParentModalToRestore('structure');
          setStructureDialogVisible(false);
          setCategoryPickerVisible(true);
          if (categories.length === 0) loadTabData('categories');
        }}
        onTriggerClassPicker={() => {
          setParentModalToRestore('structure');
          setStructureDialogVisible(false);
          setClassPickerVisible(true);
        }}
        onTriggerYearPicker={() => {
          setParentModalToRestore('structure');
          setStructureDialogVisible(false);
          setYearPickerVisible(true);
        }}
        onSubmit={handleAddStructure}
      />

      <CategoryDialog
        visible={categoryDialogVisible}
        onDismiss={() => setCategoryDialogVisible(false)}
        colors={colors}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        categoryCode={categoryCode}
        setCategoryCode={setCategoryCode}
        categoryDesc={categoryDesc}
        setCategoryDesc={setCategoryDesc}
        categoryFreq={categoryFreq}
        setCategoryFreq={setCategoryFreq}
        onSubmit={handleAddCategory}
      />

      <EditStructureDialog
        visible={editStructureDialogVisible}
        onDismiss={() => setEditStructureDialogVisible(false)}
        colors={colors}
        editingStructureItem={editingStructureItem}
        editingStructureAmount={editingStructureAmount}
        setEditingStructureAmount={setEditingStructureAmount}
        savingStructure={savingStructure}
        onSave={handleEditStructureSave}
      />

      <AssignDialog
        visible={assignDialogVisible}
        onDismiss={() => setAssignDialogVisible(false)}
        colors={colors}
        assignStructureItem={assignStructureItem}
        assignLoading={assignLoading}
        assignData={assignData}
        assignSelectedIds={assignSelectedIds}
        setAssignSelectedIds={setAssignSelectedIds}
        assignSearch={assignSearch}
        setAssignSearch={setAssignSearch}
        assignSaving={assignSaving}
        onSubmit={handleAssignSave}
      />

      <ReceiptDetailDialog
        visible={receiptDetailVisible}
        onDismiss={() => setReceiptDetailVisible(false)}
        colors={colors}
        selectedReceipt={selectedReceipt}
        schoolLogo={user?.tenantLogo || undefined}
        schoolName={user?.tenantName || undefined}
      />

      <CustomAlertDialog
        visible={customAlert.visible}
        onDismiss={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        colors={colors}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        confirmText={customAlert.confirmText}
        cancelText={customAlert.cancelText}
        onConfirm={customAlert.onConfirm}
      />
    </ThemedView>
  );
}
