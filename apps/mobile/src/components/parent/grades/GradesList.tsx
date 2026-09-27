import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';

interface GradeItem {
  subject: string;
  grade: string;
  marks: string;
  remarks: string;
}

interface GradesListProps {
  grades: GradeItem[];
}

export function GradesList({ grades }: GradesListProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#34C759';
    if (grade.startsWith('B')) return '#007AFF';
    if (grade.startsWith('C')) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Subject-wise Performance</ThemedText>
      {grades.map((item, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.subject}>{item.subject}</ThemedText>
              <ThemedText style={[styles.marks, { color: colors.textSecondary }]}>Marks: {item.marks}</ThemedText>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade) + '15' }]}>
              <ThemedText style={[styles.gradeText, { color: getGradeColor(item.grade) }]}>{item.grade}</ThemedText>
            </View>
          </View>
          <View style={styles.divider} />
          <ThemedText style={[styles.remarks, { color: colors.textSecondary }]}>
            <ThemedText style={{ fontWeight: 'bold' }}>Remarks: </ThemedText>
            {item.remarks}
          </ThemedText>
        </View>
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
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subject: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  marks: {
    fontSize: 12,
    marginTop: 2,
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  remarks: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
