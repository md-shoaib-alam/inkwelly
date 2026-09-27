import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  id: string;
  name: string;
  class?: string;
  rollNumber?: string;
}

interface ChildSelectorProps {
  students: Student[];
  selectedStudentId: string;
  onSelect: (id: string) => void;
  showAllOption?: boolean;
}

export function ChildSelector({ students, selectedStudentId, onSelect, showAllOption = false }: ChildSelectorProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const layouts = useRef<Record<string, { x: number, width: number }>>({}).current;
  const [ready, setReady] = useState(false);
  const animatedLeft = useRef(new Animated.Value(0)).current;
  const animatedRight = useRef(new Animated.Value(0)).current;
  const animatedColor = useRef(new Animated.Value(selectedStudentId === 'all' ? 1 : 0)).current;
  const [hasInitialized, setHasInitialized] = useState(false);
  const prevSelectedId = useRef(selectedStudentId);

  useEffect(() => {
    if (ready && layouts[selectedStudentId]) {
      const { x, width } = layouts[selectedStudentId];
      const targetLeft = x;
      const targetRight = x + width;

      if (!hasInitialized) {
        animatedLeft.setValue(targetLeft);
        animatedRight.setValue(targetRight);
        animatedColor.setValue(selectedStudentId === 'all' ? 1 : 0);
        setHasInitialized(true);
        prevSelectedId.current = selectedStudentId;
        return;
      }

      const options = showAllOption && students.length > 1 ? ['all', ...students.map(s => s.id)] : students.map(s => s.id);
      const prevIndex = options.indexOf(prevSelectedId.current);
      const newIndex = options.indexOf(selectedStudentId);
      prevSelectedId.current = selectedStudentId;

      const movingRight = newIndex > prevIndex;

      // Leading edge shoots ahead quickly
      const leadingConfig = {
        toValue: 0, // will be overridden
        tension: 160,
        friction: 12,
        useNativeDriver: false,
      };
      
      // Trailing edge drags slightly behind to create the stretch/bubble effect
      const trailingConfig = {
        toValue: 0, // will be overridden
        tension: 90,
        friction: 13,
        useNativeDriver: false,
      };

      Animated.parallel([
        Animated.spring(animatedLeft, {
          ...movingRight ? trailingConfig : leadingConfig,
          toValue: targetLeft,
        }),
        Animated.spring(animatedRight, {
          ...movingRight ? leadingConfig : trailingConfig,
          toValue: targetRight,
        }),
        Animated.spring(animatedColor, {
          toValue: selectedStudentId === 'all' ? 1 : 0,
          tension: 100,
          friction: 12,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [selectedStudentId, ready, layouts, hasInitialized, students, showAllOption]);

  // If there's 1 or 0 children, and we don't have showAllOption enabled, hide the switcher entirely.
  if (students.length === 0 || (students.length <= 1 && !showAllOption)) return null;

  const totalOptions = showAllOption && students.length > 1 ? students.length + 1 : students.length;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Switch Child:</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ready && layouts[selectedStudentId] && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: animatedLeft,
              width: Animated.subtract(animatedRight, animatedLeft),
              backgroundColor: animatedColor.interpolate({
                inputRange: [0, 1],
                outputRange: ['#007AFF', '#34C759'],
              }),
              borderRadius: 20,
            }}
          />
        )}

        {showAllOption && students.length > 1 && (
          <TouchableOpacity
            onLayout={(e) => {
              layouts['all'] = {
                x: e.nativeEvent.layout.x,
                width: e.nativeEvent.layout.width
              };
              if (Object.keys(layouts).length === totalOptions) {
                setReady(true);
              }
            }}
            onPress={() => onSelect('all')}
            style={[
              styles.chip,
              { 
                borderColor: selectedStudentId === 'all' ? 'transparent' : colors.backgroundSelected,
                backgroundColor: selectedStudentId === 'all' ? 'transparent' : colors.backgroundElement,
              }
            ]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="people" 
              size={14} 
              color={selectedStudentId === 'all' ? '#FFF' : colors.textSecondary} 
              style={{ marginRight: 6 }} 
            />
            <ThemedText style={[
              styles.chipText,
              { color: selectedStudentId === 'all' ? '#FFF' : colors.text }
            ]}>
              All Children
            </ThemedText>
          </TouchableOpacity>
        )}

        {students.map((student) => {
          const isSelected = student.id === selectedStudentId;
          return (
            <TouchableOpacity
              key={student.id}
              onLayout={(e) => {
                layouts[student.id] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width
                };
                if (Object.keys(layouts).length === totalOptions) {
                  setReady(true);
                }
              }}
              onPress={() => onSelect(student.id)}
              style={[
                styles.chip,
                { 
                  borderColor: isSelected ? 'transparent' : colors.backgroundSelected,
                  backgroundColor: isSelected ? 'transparent' : colors.backgroundElement,
                }
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="person" 
                size={14} 
                color={isSelected ? '#FFF' : colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <ThemedText style={[
                styles.chipText,
                { color: isSelected ? '#FFF' : colors.text }
              ]}>
                {student.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  scrollContent: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
