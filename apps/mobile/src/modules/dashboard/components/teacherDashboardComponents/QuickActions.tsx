import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/store/settings-context';

interface QuickActionsProps {
  onNavigate: (route: string) => void;
  onOpenQRScan?: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconBgLight: string;
  iconBgDark: string;
  cardBgLight: string;
  cardBgDark: string;
  cardBorderLight: string;
  cardBorderDark: string;
}

const actions: ActionItem[] = [
  {
    id: 'scan-qr',
    label: 'Scan Attendance QR',
    subtitle: 'Punch in with live QR',
    route: '/(teacher)/scan-qr',
    icon: 'qr-code-outline',
    color: '#4F46E5',
    iconBgLight: '#EEF2FF',
    iconBgDark: 'rgba(79,70,229,0.22)',
    cardBgLight: '#F5F7FF',
    cardBgDark: 'rgba(79,70,229,0.08)',
    cardBorderLight: '#E0E7FF',
    cardBorderDark: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'homework',
    label: 'Create Homework',
    subtitle: 'Assign new homework',
    route: '/(teacher)/(tabs)/homework',
    icon: 'document-text-outline',
    color: '#059669',
    iconBgLight: '#ECFDF5',
    iconBgDark: 'rgba(5,150,105,0.22)',
    cardBgLight: '#F6FEF9',
    cardBgDark: 'rgba(5,150,105,0.08)',
    cardBorderLight: '#D1FAE5',
    cardBorderDark: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'assessments',
    label: 'Assessments',
    subtitle: 'Create & manage tests',
    route: '/(teacher)/(tabs)/assessments',
    icon: 'clipboard-outline',
    color: '#E11D48',
    iconBgLight: '#FFF1F2',
    iconBgDark: 'rgba(225,29,72,0.22)',
    cardBgLight: '#FFF5F6',
    cardBgDark: 'rgba(225,29,72,0.08)',
    cardBorderLight: '#FFE4E6',
    cardBorderDark: 'rgba(244,63,94,0.25)',
  },
  {
    id: 'leaves',
    label: 'My Leaves',
    subtitle: 'Apply & check leave status',
    route: '/(teacher)/(tabs)/my-leaves',
    icon: 'airplane-outline',
    color: '#0891B2',
    iconBgLight: '#ECFEFF',
    iconBgDark: 'rgba(8,145,178,0.22)',
    cardBgLight: '#F0FDFF',
    cardBgDark: 'rgba(8,145,178,0.08)',
    cardBorderLight: '#CFFAFE',
    cardBorderDark: 'rgba(6,182,212,0.25)',
  },
];

export function QuickActions({ onNavigate, onOpenQRScan }: QuickActionsProps) {
  const { activeTheme } = useSettings();
  const isDark = activeTheme === 'dark';

  const handlePress = (act: ActionItem) => {
    if (act.id === 'scan-qr' && onOpenQRScan) {
      onOpenQRScan();
      return;
    }
    onNavigate(act.route);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderColor: isDark ? '#27272A' : '#E4E4E7',
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#27272A' : '#F4F4F5' },
        ]}
      >
        <Ionicons name="flash-outline" size={17} color="#2563EB" />
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? '#F4F4F5' : '#09090B' },
          ]}
        >
          Quick Actions
        </Text>
      </View>

      {/* Grid of Actions */}
      <View style={styles.grid}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            activeOpacity={0.7}
            onPress={() => handlePress(act)}
            style={[
              styles.actionCard,
              {
                backgroundColor: isDark ? act.cardBgDark : act.cardBgLight,
                borderColor: isDark ? act.cardBorderDark : act.cardBorderLight,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark ? act.iconBgDark : act.iconBgLight,
                  },
                ]}
              >
                <Ionicons name={act.icon} size={17} color={act.color} />
              </View>

              <View style={styles.textWrap}>
                <Text
                  style={[
                    styles.actionLabel,
                    { color: isDark ? '#F4F4F5' : '#09090B' },
                  ]}
                  numberOfLines={1}
                >
                  {act.label}
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: isDark ? '#A1A1AA' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  {act.subtitle}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={13}
              color={isDark ? '#71717A' : '#A1A1AA'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    paddingTop: 12,
    gap: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 10.5,
  },
});
