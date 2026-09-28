import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface TaskItem {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
}

interface TaskListProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
}

export function TaskList({ tasks, onToggleStatus }: TaskListProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in-progress': return 'play-circle';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in-progress': return '#007AFF';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Daily Assignments</ThemedText>
      {tasks.map((task) => (
        <TouchableOpacity 
          key={task.id} 
          style={[styles.taskCard, { backgroundColor: colors.backgroundElement }]}
          onPress={() => onToggleStatus(task.id)}
        >
          <Ionicons 
            name={getStatusIcon(task.status) as any} 
            size={24} 
            color={getStatusColor(task.status)} 
          />
          <View style={styles.taskInfo}>
            <ThemedText style={[
              styles.taskTitle, 
              task.status === 'completed' && { textDecorationLine: 'line-through', opacity: 0.6 }
            ]}>
              {task.title}
            </ThemedText>
            <View style={styles.metaRow}>
              <ThemedText style={[styles.category, { color: '#007AFF' }]}>{task.category}</ThemedText>
              <ThemedText style={[styles.dueDate, { color: colors.textSecondary }]}>Due: {task.dueDate}</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 10,
  },
  dueDate: {
    fontSize: 11,
  },
});
