import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

// Sub-components
import { TaskList } from '@/components/staff/TaskList';

export default function StaffTasksScreen() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'pending' | 'completed'>('pending');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Inspect Chemistry Lab', category: 'Maintenance', status: 'pending', dueDate: 'Today, 2:00 PM' },
    { id: '2', title: 'Update Inventory Log', category: 'Administrative', status: 'in-progress', dueDate: 'Today, 5:00 PM' },
    { id: '3', title: 'Distribute Board Circulars', category: 'Operations', status: 'completed', dueDate: 'Today, 10:00 AM' },
    { id: '4', title: 'Check Fire Extinguishers', category: 'Safety', status: 'pending', dueDate: 'Tomorrow' },
  ]);

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const filteredTasks = tasks.filter(task => 
    activeSegment === 'pending' ? task.status !== 'completed' : task.status === 'completed'
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkbox-outline" size={24} color="#34C759" />
        <ThemedText style={styles.headerTitle}>Task Management</ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#34C759']} />}
      >
        <View style={styles.segmentWrapper}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'pending' && { backgroundColor: '#34C759' }]} 
            onPress={() => setActiveSegment('pending')}
          >
            <ThemedText style={[styles.segmentText, activeSegment === 'pending' && { color: '#FFF' }]}>Active</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'completed' && { backgroundColor: '#34C759' }]} 
            onPress={() => setActiveSegment('completed')}
          >
            <ThemedText style={[styles.segmentText, activeSegment === 'completed' && { color: '#FFF' }]}>Completed</ThemedText>
          </TouchableOpacity>
        </View>

        <TaskList 
          tasks={filteredTasks} 
          onToggleStatus={toggleTaskStatus} 
        />

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
          <ThemedText style={styles.addButtonText}>Create New Task</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    padding: 2,
    borderRadius: 8,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});
