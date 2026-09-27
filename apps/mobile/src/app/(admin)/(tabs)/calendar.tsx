import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Switch, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  type: string;
  targetRole: string;
  color: string;
  allDay: boolean;
  location?: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  exam: '#EF4444',
  holiday: '#10B981',
  event: '#3B82F6',
  meeting: '#F97316',
  sports: '#8B5CF6',
  cultural: '#EC4899',
  deadline: '#F59E0B',
  other: '#6B7280',
  general: '#10B981',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: 'Exam',
  holiday: 'Holiday',
  event: 'General Event',
  meeting: 'Staff/Parent Meeting',
  sports: 'Sports Event',
  cultural: 'Cultural',
  deadline: 'Deadline',
  other: 'Other',
};

const TARGET_ROLE_LABELS: Record<string, string> = {
  all: 'All (Everyone)',
  student: 'Students',
  teacher: 'Teachers',
  staff: 'Staff Members',
  parent: 'Parents',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AcademicCalendarScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(today));
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog and form states
  const [formVisible, setFormVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formType, setFormType] = useState('event');
  const [formTargetRole, setFormTargetRole] = useState('all');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formAllDay, setFormAllDay] = useState(true);
  const [formLocation, setFormLocation] = useState('');

  // Dropdown/picker visible controls
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [endDatePickerVisible, setDatePickerEndVisible] = useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Helper date functions
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  function formatDateISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function eventFallsOnDate(ev: CalendarEvent, dateStr: string) {
    const start = ev.date;
    const end = ev.endDate || ev.date;
    return dateStr >= start && dateStr <= end;
  }

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<any>(`/events?month=${monthKey}`);
      if (res && res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const n = new Date();
    setCurrentYear(n.getFullYear());
    setCurrentMonth(n.getMonth());
    setSelectedDate(formatDateISO(n));
  };

  // Generate calendar grid dates
  const calendarCells = useMemo(() => {
    const cells: string[] = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthDays = getDaysInMonth(prevMonthYear, prevMonth);

    // Prev month days padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      cells.push(`${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    // Next month days padding to make full 6 rows (42 cells)
    const remaining = 42 - cells.length;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    for (let d = 1; d <= remaining; d++) {
      cells.push(`${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events;
    return events.filter(ev => ev.type === typeFilter);
  }, [events, typeFilter]);

  // Selected day events agenda
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter(ev => eventFallsOnDate(ev, selectedDate));
  }, [filteredEvents, selectedDate]);

  // Upcoming events starting today or in the future
  const upcomingEvents = useMemo(() => {
    const todayStr = formatDateISO(new Date());
    return filteredEvents
      .filter(ev => {
        // Must be in the future (strictly greater than today)
        const isFuture = ev.date > todayStr;
        if (!isFuture) return false;
        
        // Must be in the currently selected calendar month/year view
        const evDate = new Date(ev.date + 'T00:00:00');
        const isCurrentMonth = evDate.getFullYear() === currentYear && evDate.getMonth() === currentMonth;
        return isCurrentMonth;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, currentYear, currentMonth]);

  // Map to get events for specific date cells
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      let cursor = ev.date;
      const end = ev.endDate || ev.date;
      while (cursor <= end) {
        const existing = map.get(cursor) || [];
        existing.push(ev);
        map.set(cursor, existing);

        // Advance date by 1 day
        const d = new Date(cursor + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        cursor = formatDateISO(d);
      }
    }
    return map;
  }, [filteredEvents]);

  // Form management
  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormDate(selectedDate);
    setFormEndDate('');
    setFormType('event');
    setFormColor(EVENT_TYPE_COLORS.event);
    setFormTargetRole('all');
    setFormAllDay(true);
    setFormLocation('');
    setFormVisible(true);
  };

  const handleOpenEdit = (ev: CalendarEvent) => {
    setDialogMode('edit');
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormDesc(ev.description || '');
    setFormDate(ev.date);
    setFormEndDate(ev.endDate || '');
    setFormType(ev.type);
    setFormColor(ev.color || EVENT_TYPE_COLORS[ev.type] || '#3b82f6');
    setFormTargetRole(ev.targetRole || 'all');
    setFormAllDay(ev.allDay);
    setFormLocation(ev.location || '');
    setFormVisible(true);
  };

  const handleTypeSelect = (type: string) => {
    setFormType(type);
    setFormColor(EVENT_TYPE_COLORS[type] || '#3b82f6');
    setTypePickerVisible(false);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Required', 'Please enter event title.');
      return;
    }
    if (!formDate.trim()) {
      Alert.alert('Required', 'Please specify a start date.');
      return;
    }
    if (formEndDate.trim() && formEndDate < formDate) {
      Alert.alert('Invalid Range', 'End date cannot be before start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        date: formDate.trim(),
        endDate: formEndDate.trim() || undefined,
        type: formType,
        targetRole: formTargetRole,
        color: formColor,
        allDay: formAllDay,
        location: formLocation.trim() || undefined,
      };

      let res: any;
      if (dialogMode === 'create') {
        res = await api.post<any>('/events', payload);
      } else {
        res = await api.put<any>('/events', { id: editingEvent?.id, ...payload });
      }

      if (res && res.success) {
        setFormVisible(false);
        fetchEvents();
      } else {
        Alert.alert('Error', res?.message || 'Failed to save event');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEventToDeleteId(id);
    setDeleteConfirmVisible(true);
  };

  const executeDeleteEvent = async () => {
    if (!eventToDeleteId) return;
    try {
      setIsLoading(true);
      setDeleteConfirmVisible(false);
      const res = await api.delete<any>(`/events?id=${eventToDeleteId}`);
      if (res && res.success) {
        fetchEvents();
      } else {
        Alert.alert('Error', res?.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setIsLoading(false);
      setEventToDeleteId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
        }
      >
        <View style={styles.mainContainer}>
        {/* Month selector header */}
        <View style={[styles.headerContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={[styles.headerTitle, { fontSize: isTablet ? 22 : 18 }]}>{MONTH_NAMES[currentMonth]} {currentYear}</ThemedText>
            <TouchableOpacity onPress={goToToday} style={styles.todayPill}>
              <ThemedText style={styles.todayPillText}>Today</ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filter bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          <TouchableOpacity 
            style={[styles.filterTab, typeFilter === 'all' && { backgroundColor: '#007AFF' }]} 
            onPress={() => setTypeFilter('all')}
          >
            <ThemedText numberOfLines={1} style={[styles.filterTabText, typeFilter === 'all' && { color: '#FFF' }]}>All</ThemedText>
          </TouchableOpacity>
          {Object.keys(EVENT_TYPE_LABELS).map((type) => (
            <TouchableOpacity 
              key={type}
              style={[
                styles.filterTab, 
                typeFilter === type && { backgroundColor: EVENT_TYPE_COLORS[type] }
              ]} 
              onPress={() => setTypeFilter(type)}
            >
              <View style={[styles.filterDot, { backgroundColor: typeFilter === type ? '#FFF' : EVENT_TYPE_COLORS[type] }]} />
              <ThemedText numberOfLines={1} style={[styles.filterTabText, typeFilter === type && { color: '#FFF' }]}>
                {EVENT_TYPE_LABELS[type]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Calendar Grid */}
        <View style={[styles.calendarGrid, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          {/* Weekday labels */}
          <View style={styles.weekLabelsRow}>
            {WEEKDAY_LABELS.map((day) => (
              <ThemedText key={day} style={[styles.weekLabelText, { color: colors.textSecondary }]}>
                {day}
              </ThemedText>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.cellsGridContainer}>
            {calendarCells.map((dateStr) => {
              const cellDate = new Date(dateStr + 'T00:00:00');
              const isSelected = selectedDate === dateStr;
              const isCurrentMonth = cellDate.getMonth() === currentMonth;
              const cellDay = cellDate.getDate();

              const dayEvents = eventsByDate.get(dateStr) || [];
              const limitedEvents = dayEvents.slice(0, 3); // show max 3 event dots

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <View
                    style={[
                      styles.dayInner,
                      {
                        width: isTablet ? 40 : 32,
                        height: isTablet ? 40 : 32,
                        borderRadius: isTablet ? 20 : 16,
                      },
                      isSelected && { 
                        backgroundColor: '#007AFF',
                        shadowColor: '#007AFF',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      }
                    ]}
                  >
                    <ThemedText 
                      style={[
                        styles.dayCellText,
                        { 
                          color: isCurrentMonth ? colors.text : colors.textSecondary,
                          fontSize: isTablet ? 16 : 13
                        },
                        isSelected && { color: '#FFF', fontWeight: 'bold' }
                      ]}
                    >
                      {cellDay}
                    </ThemedText>
                  </View>
                  
                  {/* Event dots */}
                  <View style={styles.dotsContainer}>
                    {limitedEvents.map((ev, index) => (
                      <View 
                        key={ev.id || index} 
                        style={[
                          styles.eventDot, 
                          { backgroundColor: isSelected ? '#007AFF' : (ev.color || EVENT_TYPE_COLORS[ev.type] || '#3b82f6') }
                        ]} 
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Agenda Events Title */}
        <View style={styles.agendaTitleRow}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            Events for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </ThemedText>
          {isAdmin && (
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
              <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <ThemedText style={styles.addBtnText}>Add Event</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Agenda Events List */}
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : selectedDayEvents.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.backgroundSelected} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>No events scheduled for this day.</ThemedText>
          </View>
        ) : (
          selectedDayEvents.map((item) => {
            const evColor = item.color || EVENT_TYPE_COLORS[item.type] || '#3b82f6';
            return (
              <View 
                key={item.id} 
                style={[
                  styles.eventCard, 
                  { backgroundColor: colors.backgroundElement, borderColor: evColor }
                ]}
              >
                <View style={styles.eventCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <ThemedText style={[styles.eventTitle, { fontSize: isTablet ? 18 : 15 }]}>{item.title}</ThemedText>
                      <View style={[styles.typeBadge, { backgroundColor: `${evColor}15`, flexShrink: 0 }]}>
                        <ThemedText numberOfLines={1} style={{ color: evColor, fontSize: 10, fontWeight: '700' }}>
                          {EVENT_TYPE_LABELS[item.type] || item.type.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                    {!!item.location && (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <ThemedText style={styles.metaText}>{item.location}</ThemedText>
                      </View>
                    )}
                  </View>
                  {isAdmin && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.iconActionBtn}>
                        <Ionicons name="create-outline" size={16} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.iconActionBtn}>
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {!!item.description && (
                  <ThemedText style={[styles.eventDesc, { color: colors.textSecondary, fontSize: isTablet ? 15 : 13 }]}>
                    {item.description}
                  </ThemedText>
                )}

                <View style={[styles.eventCardFooter, { borderTopColor: colors.backgroundSelected }]}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                    <ThemedText style={styles.metaText}>For: {TARGET_ROLE_LABELS[item.targetRole] || item.targetRole}</ThemedText>
                  </View>
                  {item.endDate && item.endDate !== item.date && (
                    <ThemedText style={styles.metaText}>Ends: {item.endDate}</ThemedText>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Upcoming Events Section */}
        <View style={{ marginTop: 28, marginBottom: 20 }}>
          <View style={[styles.agendaTitleRow, { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected, paddingBottom: 8, marginBottom: 16 }]}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>Upcoming Events</ThemedText>
          </View>
          {upcomingEvents.length === 0 ? (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, paddingVertical: 20 }]}>
              <ThemedText style={{ color: colors.textSecondary }}>No upcoming events scheduled.</ThemedText>
            </View>
          ) : (
            upcomingEvents.slice(0, 5).map((item) => {
              const evColor = item.color || EVENT_TYPE_COLORS[item.type] || '#3b82f6';
              // Format date nicely
              const eventDateObj = new Date(item.date + 'T00:00:00');
              const formattedDate = eventDateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <View 
                  key={`upcoming-${item.id}`} 
                  style={[
                    styles.eventCard, 
                    { 
                      backgroundColor: colors.backgroundElement, 
                      borderColor: evColor
                    }
                  ]}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <ThemedText style={[styles.eventTitle, { fontSize: isTablet ? 18 : 15 }]}>{item.title}</ThemedText>
                        <View style={[styles.typeBadge, { backgroundColor: `${evColor}15`, flexShrink: 0 }]}>
                          <ThemedText numberOfLines={1} style={{ color: evColor, fontSize: 10, fontWeight: '700' }}>
                            {EVENT_TYPE_LABELS[item.type] || item.type.toUpperCase()}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 6 }}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <ThemedText style={styles.metaText}>
                          {formattedDate}{item.endDate && item.endDate !== item.date ? ` - ${new Date(item.endDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
        </View>
      </ScrollView>

      {/* Add / Edit Event Dialog Modal */}
      <Portal>
        <Dialog 
          visible={formVisible} 
          onDismiss={() => !isSubmitting && setFormVisible(false)}
          style={{ backgroundColor: colors.backgroundElement, borderRadius: 20 }}
        >
          <Dialog.Title style={{ color: colors.text }}>{dialogMode === 'create' ? 'Add Event' : 'Edit Event'}</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 380, borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}>
              
              {/* Event Title */}
              <ThemedText style={styles.inputLabel}>Event Title *</ThemedText>
              <TextInput 
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Enter event title"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />

              {/* Event Description */}
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput 
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Enter event description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected, height: 80, textAlignVertical: 'top' }]}
              />

              {/* Event Location */}
              <ThemedText style={styles.inputLabel}>Location</ThemedText>
              <TextInput 
                value={formLocation}
                onChangeText={setFormLocation}
                placeholder="e.g. Auditorium, Playground"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />

              {/* Start Date */}
              {/* Start Date */}
              <ThemedText style={styles.inputLabel}>Start Date *</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setStartDatePickerVisible(true)}
              >
                <ThemedText style={{ color: formDate ? colors.text : colors.textSecondary }}>
                  {formDate || 'Select Start Date'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* End Date */}
              <ThemedText style={styles.inputLabel}>End Date (Optional)</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setDatePickerEndVisible(true)}
              >
                <ThemedText style={{ color: formEndDate ? colors.text : colors.textSecondary }}>
                  {formEndDate || 'Select End Date'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Event Type selector trigger */}
              <ThemedText style={styles.inputLabel}>Event Type</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setTypePickerVisible(true)}
              >
                <ThemedText style={{ color: colors.text }}>{EVENT_TYPE_LABELS[formType] || formType}</ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Target Role selector trigger */}
              <ThemedText style={styles.inputLabel}>Visible To (Target Audience)</ThemedText>
              <TouchableOpacity 
                style={[styles.pickerTrigger, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                onPress={() => setRolePickerVisible(true)}
              >
                <ThemedText style={{ color: colors.text }}>{TARGET_ROLE_LABELS[formTargetRole] || formTargetRole}</ThemedText>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* All Day Toggle */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <ThemedText style={{ color: colors.text }}>All Day Event</ThemedText>
                <Switch 
                  value={formAllDay}
                  onValueChange={setFormAllDay}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor="#FFF"
                />
              </View>

            </ScrollView>
          </Dialog.ScrollArea>
          
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
            <Button 
              mode="outlined"
              textColor={colors.textSecondary} 
              style={{ borderRadius: 20, borderColor: colors.backgroundSelected, flex: 1 }} 
              onPress={() => setFormVisible(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              buttonColor="#007AFF"
              textColor="#FFF"
              style={{ borderRadius: 20, flex: 1 }} 
              onPress={handleSaveEvent} 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {dialogMode === 'create' ? 'Save' : 'Update'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dropdown Pickers Modals */}
      <Portal>
        {/* Type Picker */}
        <Dialog visible={typePickerVisible} onDismiss={() => setTypePickerVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Event Type</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {Object.keys(EVENT_TYPE_LABELS).map((type) => (
                <TouchableOpacity 
                  key={type} 
                  style={styles.pickerItem} 
                  onPress={() => handleTypeSelect(type)}
                >
                  <View style={[styles.filterDot, { backgroundColor: EVENT_TYPE_COLORS[type] }]} />
                  <ThemedText style={{ color: colors.text }}>{EVENT_TYPE_LABELS[type]}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Role Picker */}
        <Dialog visible={rolePickerVisible} onDismiss={() => setRolePickerVisible(false)} style={{ backgroundColor: colors.backgroundElement }}>
          <Dialog.Title style={{ color: colors.text }}>Select Target Audience</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {Object.keys(TARGET_ROLE_LABELS).map((role) => (
                <TouchableOpacity 
                  key={role} 
                  style={styles.pickerItem} 
                  onPress={() => {
                    setFormTargetRole(role);
                    setRolePickerVisible(false);
                  }}
                >
                  <ThemedText style={{ color: colors.text }}>{TARGET_ROLE_LABELS[role]}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        {/* Start Date Picker Modal */}
        <DatePickerModal
          visible={startDatePickerVisible}
          onDismiss={() => setStartDatePickerVisible(false)}
          onSelectDate={(dateStr) => {
            setFormDate(dateStr);
            setStartDatePickerVisible(false);
          }}
          value={formDate}
          title="Select Start Date"
        />

        {/* End Date Picker Modal */}
        <DatePickerModal
          visible={endDatePickerVisible}
          onDismiss={() => setDatePickerEndVisible(false)}
          onSelectDate={(dateStr) => {
            setFormEndDate(dateStr);
            setDatePickerEndVisible(false);
          }}
          value={formEndDate}
          title="Select End Date"
          minDate={formDate}
        />

        {/* Custom Delete Confirmation Dialog */}
        {deleteConfirmVisible && (
          <Dialog
            visible={true}
            onDismiss={() => setDeleteConfirmVisible(false)}
            style={{ backgroundColor: colors.backgroundElement, borderRadius: 24, alignSelf: 'center', maxWidth: 340, width: '85%' }}
          >
            <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 20 }}>
              <Ionicons name="trash-outline" size={48} color="#FF3B30" />
              <Dialog.Title style={{ color: '#FF3B30', marginTop: 12, marginBottom: 8, textAlign: 'center', fontSize: 18, fontWeight: '700' }}>
                Delete Event
              </Dialog.Title>
              <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
                Are you sure you want to permanently delete this event? This action cannot be undone.
              </ThemedText>
            </View>
            <Dialog.Actions style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'center' }}>
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  borderWidth: 1, 
                  borderColor: colors.backgroundSelected, 
                  borderRadius: 999, 
                  paddingVertical: 12, 
                  alignItems: 'center' 
                }} 
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <ThemedText style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#FF3B30', 
                  borderRadius: 999, 
                  paddingVertical: 12, 
                  alignItems: 'center' 
                }} 
                onPress={executeDeleteEvent}
              >
                <ThemedText style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Delete</ThemedText>
              </TouchableOpacity>
            </Dialog.Actions>
          </Dialog>
        )}
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayPill: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  todayPillText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '600',
  },
  filterBar: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#00000008',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#00000010',
    flexShrink: 0,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekLabelText: {
    fontSize: 12,
    fontWeight: '600',
    width: '14.28%',
    textAlign: 'center',
  },
  cellsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellText: {
    fontSize: 13,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
    marginTop: 4,
    justifyContent: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  agendaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#00000005',
  },
  eventDesc: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pickerTrigger: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
