import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { EmptyTimetableState } from '@/modules/timetable/components/EmptyTimetableState';
import { Skeleton } from '@/components/Skeleton';

// Subcomponents
import { TimetableSlot, DAYS } from '@/modules/timetable/components/adminTimetable/types';
import { TimetableSlotCard } from '@/modules/timetable/components/adminTimetable/TimetableSlotCard';

export default function TeacherTimetable() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const jsDay = new Date().getDay();
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[jsDay];
  });
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);

  // Fetch tenant settings for working days
  useEffect(() => {
    async function loadTenantSettings() {
      try {
        const res = await api.get<any>('/tenant-settings');
        const wDays = res?.settings?.workingDays;
        if (Array.isArray(wDays)) {
          setWorkingDays(wDays);
          
          const jsDay = new Date().getDay();
          const dayMap: Record<number, string> = {
            0: 'sunday',
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday',
          };
          const todayKey = dayMap[jsDay];
          if (wDays.includes(todayKey)) {
            setSelectedDay(todayKey);
          } else if (wDays.length > 0) {
            setSelectedDay(wDays[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load tenant settings for working days:', err);
      }
    }
    loadTenantSettings();
  }, []);

  // Fetch timetable slots for teacher (mine=true)
  const fetchTimetable = useCallback(async () => {
    try {
      setIsLoading(true);
      const startTime = Date.now();
      const res = await api.get<any>('/timetable', { params: { mine: 'true' } });
      setSlots(res);

      const elapsed = Date.now() - startTime;
      const minDuration = 400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTimetable();
  };

  // Filter slots for the active day tab
  const activeDaySlots = useMemo(() => {
    return slots
      .filter(s => s.day.toLowerCase() === selectedDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedDay]);

  const flashListRef = React.useRef<any>(null);

  const currentSlotIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    const todayStr = dayMap[jsDay].toLowerCase();
    
    if (selectedDay.toLowerCase() !== todayStr) return -1;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return activeDaySlots.findIndex(slot => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  }, [activeDaySlots, selectedDay]);

  useEffect(() => {
    if (currentSlotIndex !== -1 && activeDaySlots.length > 0) {
      const timer = setTimeout(() => {
        try {
          flashListRef.current?.scrollToIndex({
            index: currentSlotIndex,
            animated: true,
            viewPosition: 0.3
          });
        } catch (e) {
          console.warn('Scroll to current period failed:', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSlotIndex, activeDaySlots]);

  const filteredDays = useMemo(() => {
    return DAYS.filter(d => workingDays.includes(d.key.toLowerCase()));
  }, [workingDays]);

  const dayTabsScrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (filteredDays.length > 0 && selectedDay) {
      const index = filteredDays.findIndex(d => d.key.toLowerCase() === selectedDay.toLowerCase());
      if (index !== -1) {
        const approxTabWidth = 72;
        const gap = 8;
        const offset = Math.max(0, index * (approxTabWidth + gap) - 100);
        const timer = setTimeout(() => {
          dayTabsScrollRef.current?.scrollTo({ x: offset, y: 0, animated: true });
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedDay, filteredDays]);

  return (
    <ThemedView style={styles.container}>
      {/* Header section with tabs */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSelected }]}>
        <ScrollView 
          ref={dayTabsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsContainer}
        >
          {filteredDays.map(day => {
            const isActive = selectedDay === day.key;
            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: '#007AFF', borderColor: '#007AFF' },
                  !isActive && { borderColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }
                ]}
                onPress={() => setSelectedDay(day.key)}
              >
                <ThemedText style={[styles.tabText, { color: isActive ? '#FFF' : colors.text }]}>
                  {day.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      {isLoading ? (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
        >
          {[1, 2, 3, 4].map(i => (
            <View 
              key={i} 
              style={{ 
                flexDirection: 'row',
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                backgroundColor: colors.backgroundElement,
                borderWidth: 1,
                borderColor: colors.backgroundSelected,
                height: 86,
                alignItems: 'center'
              }}
            >
              <View style={{ width: 60, gap: 4, alignItems: 'center' }}>
                <Skeleton width={45} height={12} />
                <Skeleton width={10} height={10} />
                <Skeleton width={45} height={12} />
              </View>
              <View style={{ width: 1, height: '100%', backgroundColor: colors.backgroundSelected, marginHorizontal: 16 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlashList
          ref={flashListRef}
          data={activeDaySlots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />}
          ListEmptyComponent={
            <EmptyTimetableState 
              selectedClass=""
              classes={[]}
              onClassSelect={() => {}}
              isTeacher={true}
            />
          }
          renderItem={({ item }) => (
            <TimetableSlotCard
              item={item}
              colors={colors}
              isAdmin={false}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
});
