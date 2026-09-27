import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Portal, Dialog, Button, Avatar } from 'react-native-paper';

const TypedFlashList = FlashList as any;

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  studentCount?: number;
}

interface StudentInfo {
  id: string;
  name: string;
  rollNumber: string;
  gender: string;
  email: string;
}

export default function MyClassesScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const [res, resTimetable] = await Promise.all([
        api.get('/classes?all=true').catch(() => []),
        api.get('/timetable?mine=true').catch(() => [])
      ]);

      const assignedClasses = Array.isArray(res) ? res : [];
      const timetableList = Array.isArray(resTimetable) ? resTimetable : [];

      // Extract unique classes from timetable slots
      const timetableClasses: ClassInfo[] = [];
      const seen = new Set<string>();
      timetableList.forEach((t: any) => {
        if (t.classId && t.className) {
          const key = t.classId;
          if (!seen.has(key)) {
            seen.add(key);
            const parts = t.className.split('-');
            timetableClasses.push({
              id: t.classId,
              name: parts[0] || t.className,
              section: parts[1] || 'A',
              studentCount: 0
            });
          }
        }
      });

      // Combine both lists
      const combined = [...assignedClasses];
      const seenCombined = new Set(assignedClasses.map(c => c.id));
      timetableClasses.forEach((tc) => {
        if (!seenCombined.has(tc.id)) {
          seenCombined.add(tc.id);
          combined.push(tc);
        }
      });

      setClasses(combined);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleOpenClass = async (cls: ClassInfo) => {
    setSelectedClass(cls);
    setModalVisible(true);
    setStudentsLoading(true);
    try {
      const res = await api.get<any>(`/students?classId=${cls.id}`);
      if (res && Array.isArray(res.items)) {
        setStudents(res.items);
      } else if (Array.isArray(res)) {
        setStudents(res);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlashList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color={colors.backgroundSelected} />
              <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>
                No classes assigned to you.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.classCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
              onPress={() => handleOpenClass(item)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: '#007AFF12' }]}>
                  <Ionicons name="school" size={24} color="#007AFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={styles.className}>{item.name}</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>Section {item.section}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.cardFooter}>
                <Ionicons name="people-outline" size={16} color="#007AFF" style={{ marginRight: 6 }} />
                <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>
                  {item.studentCount ?? 0} Students
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Students List Modal */}
      <Portal>
        <Dialog 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, maxHeight: Dimensions.get('window').height * 0.8, maxWidth: 400, width: '90%', alignSelf: 'center' }}
        >
          <Dialog.Title style={{ color: colors.text }}>
            {selectedClass?.name} - Sec {selectedClass?.section}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            {studentsLoading ? (
              <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <View style={{ height: 350, width: '100%' }}>
                <TypedFlashList
                  data={students}
                  keyExtractor={(item: any) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                  estimatedItemSize={50}
                  ListEmptyComponent={
                    <View style={{ padding: 30, alignItems: 'center' }}>
                      <ThemedText style={{ color: colors.textSecondary }}>No students found in this class.</ThemedText>
                    </View>
                  }
                  renderItem={({ item, index }: any) => (
                    <View style={[styles.studentItem, { borderBottomColor: colors.backgroundSelected }]}>
                      <ThemedText style={[styles.indexText, { color: colors.textSecondary }]}>{index + 1}</ThemedText>
                      <Avatar.Text 
                        size={32} 
                        label={getInitials(item.name)} 
                        style={{ backgroundColor: '#007AFF15' }} 
                        labelStyle={{ color: '#007AFF', fontSize: 11, fontWeight: '700' }}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={{ fontWeight: '600', fontSize: 14, color: colors.text }}>{item.name}</ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>Roll No: {item.rollNumber || 'N/A'}</ThemedText>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingBottom: 16, paddingHorizontal: 16 }}>
            <Button 
              mode="contained" 
              buttonColor="#007AFF" 
              textColor="#FFF" 
              style={{ borderRadius: 20, minWidth: 100 }} 
              labelStyle={{ fontWeight: '700' }}
              onPress={() => setModalVisible(false)}
            >
              Close
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  classCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
});
