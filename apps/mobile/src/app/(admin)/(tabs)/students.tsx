import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, useWindowDimensions, FlatList } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button, RadioButton } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { adminCache } from '@/lib/adminCache';
import { Colors } from '@/constants/theme';
import { ClassSelector } from '@/modules/academics/components/AdminClassSelector';
import { useSettings } from '@/store/settings-context';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Student } from '@/modules/people/components/adminStudents/types';
import { StudentCard } from '@/modules/people/components/adminStudents/StudentCard';
import { Skeleton } from '@/components/Skeleton';

export default function StudentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{ classId?: string }>();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    if (params.classId) {
      setClassFilter(params.classId);
      setShowFilters(true);
    }
  }, [params.classId]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Custom alert dialog states
  const [statusConfirmVisible, setStatusConfirmVisible] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [genderPickerVisible, setGenderPickerVisible] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canCreate = isAdmin;

  const fetchStudents = useCallback(async (pageNum: number, shouldAppend: boolean = false) => {
    try {
      if (pageNum === 1) {
        if (!shouldAppend) {
          setIsLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }

      const res = await api.get<any>('/students', {
        params: {
          page: pageNum,
          limit: 20,
          search: search || undefined,
          classId: classFilter === 'all' ? undefined : classFilter,
          gender: genderFilter === 'all' ? undefined : genderFilter,
          status: statusFilter,
        }
      });

      if (shouldAppend) {
        setStudents(prev => [...prev, ...res.items]);
      } else {
        setStudents(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
      if (pageNum === 1 && !search && classFilter === 'all' && genderFilter === 'all' && statusFilter === 'active') {
        adminCache.markFetched('students');
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [search, classFilter, genderFilter, statusFilter]);

  // Subscribe to mutations (Add, Edit, Delete from other screens)
  useEffect(() => {
    const unsubscribe = adminCache.subscribe('students', () => {
      fetchStudents(1);
    });
    return unsubscribe;
  }, [fetchStudents]);

  useEffect(() => {
    const delay = search ? 300 : 0;
    const timer = setTimeout(() => {
      // If default list is already fresh in memory, skip redundant initial fetch
      if (!search && classFilter === 'all' && genderFilter === 'all' && statusFilter === 'active' && adminCache.isFresh('students') && students.length > 0) {
        return;
      }
      fetchStudents(1);
    }, delay);
    return () => clearTimeout(timer);
  }, [fetchStudents, search, classFilter, genderFilter, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      // When returning to this screen: only re-fetch if cache is invalidated or expired
      if (!adminCache.isFresh('students') || students.length === 0) {
        fetchStudents(1);
      }
      return () => {
        setSelectedStudent(null);
      };
    }, [fetchStudents, students.length])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    adminCache.invalidate('students');
    fetchStudents(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore && !isLoading && !isRefreshing) {
      fetchStudents(page + 1, true);
    }
  };


  const handleOpenCreate = () => {
    router.push({ pathname: '/(admin)/students/new' });
  };

  const handleOpenEdit = (student: Student) => {
    router.push({
      pathname: '/(admin)/students/new',
      params: {
        mode: 'edit',
        id: student.id,
        name: student.name || '',
        username: student.username || '',
        email: student.email || '',
        phone: student.phone || '',
        rollNumber: student.rollNumber || '',
        classId: student.classId || '',
        gender: student.gender || 'male',
        dateOfBirth: student.dateOfBirth || '',
        bloodGroup: (student as any).bloodGroup || '',
        parentId: student.parentId || '',
        transportEnabled: student.transport ? 'true' : 'false',
        routeId: student.transport?.routeId || '',
        pickupPoint: student.transport?.pickupPoint || '',
      },
    });
  };

  const handleToggleStatusClick = (student: Student) => {
    setStudentToToggle(student);
    setStatusConfirmVisible(true);
  };

  const matchesStudentFilters = (s: any) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const emailMatch = (s.email || '').toLowerCase().includes(q);
      const rollMatch = (s.rollNumber || '').toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !rollMatch) return false;
    }
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
    if (statusFilter !== 'all' && (s.status || 'active') !== statusFilter) return false;
    return true;
  };

  const handleToggleStatus = async () => {
    if (!studentToToggle) return;
    const targetId = studentToToggle.id;
    const nextStatus = studentToToggle.status === 'inactive' ? 'active' : 'inactive';
    try {
      await api.put('/students', {
        id: targetId,
        status: nextStatus
      });
      setStatusConfirmVisible(false);
      setSelectedStudent(prev => (prev && prev.id === targetId ? { ...prev, status: nextStatus } : prev));
      setStudents(prev => {
        if (statusFilter !== 'all' && nextStatus !== statusFilter) {
          return prev.filter(s => s.id !== targetId);
        }
        return prev.map(s => s.id === targetId ? { ...s, status: nextStatus } : s);
      });
    } catch {
      setErrorMsg('Failed to update student status.');
      setErrorVisible(true);
    }
  };



  const handleImportClick = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          setIsLoading(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('dataType', 'students');
          
          const response = await api.post<any>('/import', formData);
          
          if (response && (response.success || response.status === 'queued')) {
            Alert.alert('Success', `Import started successfully. ${response.imported || 0} students imported.`);
            fetchStudents(1);
          } else {
            Alert.alert('Import Issue', response?.error || 'Some rows had errors during import.');
            fetchStudents(1);
          }
        } catch (err: any) {
          console.error(err);
          Alert.alert('Error', err.message || 'Failed to import students.');
        } finally {
          setIsLoading(false);
        }
      };
      input.click();
    } else {
      try {
        const DocumentPicker = await import('expo-document-picker');
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'text/comma-separated-values',
            '*/*'
          ],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setIsLoading(true);
          
          const formData = new FormData();
          // @ts-ignore - React Native FormData file object structure
          formData.append('file', {
            uri: asset.uri,
            name: asset.name || 'students_import.xlsx',
            type: asset.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          formData.append('dataType', 'students');

          const response = await api.post<any>('/import', formData);
          
          if (response && (response.success || response.status === 'queued')) {
            Alert.alert('Success', `Import started successfully. ${response.imported || 0} students imported.`);
            fetchStudents(1);
          } else {
            Alert.alert('Import Issue', response?.error || 'Some rows had errors during import.');
            fetchStudents(1);
          }
        }
      } catch (err: any) {
        console.error('Mobile document picker error:', err);
        Alert.alert('Import Failed', err.message || 'Could not pick or upload the file.');
      } finally {
        setIsLoading(false);
      }
    }
  };


  return (
    <ThemedView style={styles.container} safeAreaTop>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement, marginRight: 8 }]}
          />
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.importBtn, { borderColor: colors.backgroundSelected, backgroundColor: showFilters ? colors.backgroundSelected : 'transparent' }]}
          >
            <Ionicons name="funnel-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>Filter</ThemedText>
          </TouchableOpacity>
        </View>
        {showFilters && (
          <View style={[styles.filtersExpanded, { borderTopColor: colors.backgroundSelected }]}>
            {/* Single Row: Class Selector, Gender Selector & Status Selector side-by-side */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              {/* Class Filter */}
              <View style={{ flex: 1.4, gap: 4 }}>
                <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>Class</ThemedText>
                <ClassSelector
                  value={classFilter}
                  onValueChange={setClassFilter}
                  showAllOption
                />
              </View>

              {/* Gender Filter */}
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>Gender</ThemedText>
                <TouchableOpacity 
                  style={[
                    styles.dropdownTrigger, 
                    { 
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected
                    }
                  ]} 
                  onPress={() => setGenderPickerVisible(true)}
                >
                  <ThemedText style={[styles.dropdownTriggerText, { color: colors.text }]}>
                    {genderFilter === 'all' ? 'All' : genderFilter === 'male' ? 'Male' : 'Female'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Status Filter */}
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</ThemedText>
                <TouchableOpacity 
                  style={[
                    styles.dropdownTrigger, 
                    { 
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.backgroundSelected
                    }
                  ]} 
                  onPress={() => setStatusPickerVisible(true)}
                >
                  <ThemedText style={[styles.dropdownTriggerText, { color: colors.text }]}>
                    {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {(isLoading || isRefreshing) && students.length === 0 ? (
        <View style={styles.listContent}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
              <Skeleton width={42} height={42} borderRadius={21} style={{ marginRight: 12 }} />
              <View style={styles.skeletonInfo}>
                <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Skeleton width={50} height={12} borderRadius={6} />
                  <Skeleton width={65} height={12} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : Platform.OS === 'web' ? (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard 
              item={item}
              colors={colors}
              onPress={(student) => {
                router.push({ pathname: '/(admin)/students/[id]', params: { id: student.id } });
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 16 }} />
            ) : students.length > 0 && page >= totalPages ? (
              <View style={styles.footerContainer}>
                <View style={[styles.footerDivider, { backgroundColor: colors.backgroundSelected }]} />
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                  End of student list
                </ThemedText>
                <View style={[styles.footerDivider, { backgroundColor: colors.backgroundSelected }]} />
              </View>
            ) : (
              <View style={{ height: 20 }} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No students found.</ThemedText>
            </View>
          }
        />
      ) : (
        <FlashList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard 
              item={item}
              colors={colors}
              onPress={(student) => {
                router.push({ pathname: '/(admin)/students/[id]', params: { id: student.id } });
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 16 }} />
            ) : students.length > 0 && page >= totalPages ? (
              <View style={styles.footerContainer}>
                <View style={[styles.footerDivider, { backgroundColor: colors.backgroundSelected }]} />
                <ThemedText style={[styles.footerText, { color: colors.textSecondary }]}>
                  End of student list
                </ThemedText>
                <View style={[styles.footerDivider, { backgroundColor: colors.backgroundSelected }]} />
              </View>
            ) : (
              <View style={{ height: 20 }} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No students found.</ThemedText>
            </View>
          }
        />
      )}

      {canCreate && !actionMenuVisible && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setActionMenuVisible(true)}
          color="#FFF"
        />
      )}
      {/* Portal for Custom Delete Alerts */}
      <Portal>
        {/* Custom Confirmation Alert */}
        <Dialog
          visible={statusConfirmVisible}
          onDismiss={() => setStatusConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {studentToToggle?.status === 'inactive' ? 'Activate Student' : 'Deactivate Student'}
          </Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              Are you sure you want to {studentToToggle?.status === 'inactive' ? 'activate' : 'deactivate'} student "{studentToToggle?.name}"?
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: 10, paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="outlined" 
              textColor="#007AFF" 
              style={{ borderRadius: 20, borderColor: '#007AFF', borderWidth: 1, minWidth: 100 }} 
              labelStyle={{ fontWeight: '600' }}
              onPress={() => setStatusConfirmVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor={studentToToggle?.status === 'inactive' ? '#34C759' : '#FF9500'} 
              textColor="#FFFFFF" 
              style={{ borderRadius: 20, minWidth: 100 }}
              labelStyle={{ fontWeight: '700' }}
              onPress={handleToggleStatus}
            >
              {studentToToggle?.status === 'inactive' ? 'Activate' : 'Deactivate'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Action Options Popover */}
        {actionMenuVisible && (
          <>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setActionMenuVisible(false)} 
            />
            <View 
              onStartShouldSetResponder={() => true}
              style={[
                styles.popoverMenu, 
                { 
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                  bottom: 145,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setActionMenuVisible(false);
                  handleOpenCreate();
                }}
                style={styles.popoverItem}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <ThemedText style={[styles.popoverText, { color: colors.text }]}>Add Manually</ThemedText>
              </TouchableOpacity>
              
              {isAdmin && (
                <>
                  <View style={[styles.popoverDivider, { backgroundColor: colors.backgroundSelected }]} />
                  <TouchableOpacity
                    onPress={() => {
                      setActionMenuVisible(false);
                      handleImportClick();
                    }}
                    style={styles.popoverItem}
                  >
                    <Ionicons name="document-text-outline" size={20} color="#34C759" />
                    <ThemedText style={[styles.popoverText, { color: colors.text }]}>Import Excel</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* Gender Selection Dialog */}
        <Dialog
          visible={genderPickerVisible}
          onDismiss={() => setGenderPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Gender</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300, borderColor: colors.backgroundSelected }}>
            <ScrollView>
              <RadioButton.Group onValueChange={val => {
                setGenderFilter(val as any);
                setGenderPickerVisible(false);
              }} value={genderFilter}>
                <RadioButton.Item label="All" value="all" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
                <RadioButton.Item label="Male" value="male" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
                <RadioButton.Item label="Female" value="female" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setGenderPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Status Selection Dialog */}
        <Dialog
          visible={statusPickerVisible}
          onDismiss={() => setStatusPickerVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Status</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300, borderColor: colors.backgroundSelected }}>
            <ScrollView>
              <RadioButton.Group onValueChange={val => {
                setStatusFilter(val as any);
                setStatusPickerVisible(false);
              }} value={statusFilter}>
                <RadioButton.Item label="All" value="all" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
                <RadioButton.Item label="Active" value="active" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
                <RadioButton.Item label="Inactive" value="inactive" labelStyle={{ color: colors.text }} uncheckedColor={colors.textSecondary} color="#007AFF" />
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor="#007AFF" onPress={() => setStatusPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Custom Error Dialog */}
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: '#FF3B30' }}>Error</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text, fontSize: 14 }}>
              {errorMsg}
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setErrorVisible(false)}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersExpanded: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
    gap: 12,
  },
  filterField: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownTriggerText: {
    fontSize: 14,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  popoverMenu: {
    position: 'absolute',
    right: 16,
    width: 170,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingVertical: 4,
    zIndex: 999,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  popoverText: {
    fontSize: 14,
    fontWeight: '600',
  },
  popoverDivider: {
    height: 1,
    width: '100%',
  },
  statusDropdownMenu: {
    position: 'absolute',
    right: 16,
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingVertical: 4,
    zIndex: 999,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: '#007AFF',
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  skeletonInfo: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerDivider: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
  },
});
