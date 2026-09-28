import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/store/settings-context';
import { Colors } from '@/constants/theme';
import type { Parent } from '../types';
import { 
  ParentProfileProps, 
  ParentProfileTab, 
  EMERALD, 
  getInitials 
} from './types';
import { ParentOverviewTab } from './ParentOverviewTab';
import { ParentChildrenTab } from './ParentChildrenTab';
import { ProfileActionsModal, ActionItem } from '@/components/ui/ProfileActionsModal';

const TABS: { id: ParentProfileTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'overview', label: 'Overview', icon: 'person-outline' },
  { id: 'children', label: 'Children', icon: 'people-outline' },
  { id: 'fees', label: 'Fees & Payments', icon: 'card-outline' },
];

export function ParentProfileView({
  parent,
  onBack,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
  onLinkChildClick,
  onUnlinkChildClick,
  onRefresh,
}: ParentProfileProps) {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { width } = useWindowDimensions();

  const isTablet = width >= 650;
  const isLargeTablet = width >= 860;
  const isDark = activeTheme === 'dark';

  const [currentParent, setCurrentParent] = useState<Parent>(parent);
  const [activeTab, setActiveTab] = useState<ParentProfileTab>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Sync prop changes (e.g. after child linked/unlinked or new parent selected)
  React.useEffect(() => {
    setCurrentParent(parent);
  }, [parent?.id, parent?.children?.length]);

  React.useEffect(() => {
    setActiveTab('overview');
  }, [parent?.id]);

  const displayParentId = `PRN${(currentParent.id || '20265626').replace(/\D/g, '').slice(0, 8) || '20265626'}`;

  const handleCopy = async (text: string, fieldName: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Copied', `${fieldName} copied to clipboard!`);
  };

  const menuActions: ActionItem[] = [
    ...(canEdit && onEdit ? [{
      id: 'edit',
      label: 'Edit Parent',
      icon: 'pencil-outline' as const,
      color: '#059669',
      onPress: () => onEdit(currentParent),
    }] : []),
    ...(canEdit && onLinkChildClick ? [{
      id: 'link',
      label: 'Link Child',
      icon: 'person-add-outline' as const,
      color: '#0D9488',
      onPress: onLinkChildClick,
    }] : []),
    ...(canDelete && onDelete ? [{
      id: 'delete',
      label: 'Delete Parent',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => onDelete(currentParent),
    }] : []),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.backgroundElement }]}>
      {/* 1. Top Navigation & Breadcrumb Bar */}
      <View style={styles.topNavBar}>
        <View style={styles.navLeftRow}>
          <TouchableOpacity 
            style={[styles.backPillBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color="#1F2937" style={{ marginRight: 4 }} />
            <ThemedText style={[styles.backBtnText, { color: '#1F2937' }]}>
              Back to Parents
            </ThemedText>
          </TouchableOpacity>

          {isTablet && (
            <ThemedText style={[styles.breadcrumbText, { color: colors.textSecondary }]}>
              Parents  ›  Parent Profile
            </ThemedText>
          )}
        </View>

        <View style={styles.navRightRow}>
          {isTablet && canEdit && onEdit && (
            <TouchableOpacity
              style={styles.tabletEditBtn}
              onPress={() => onEdit(currentParent)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-sharp" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <ThemedText style={styles.tabletEditBtnText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.menuCircleBtn, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <View style={[styles.headerTopRow, isTablet && styles.headerTopRowTablet]}>
            {/* Left Col: Avatar + Name + Meta */}
            <View style={[styles.headerLeftCol, { flex: 1 }]}>
              <View style={styles.avatarAndTitleRow}>
                {/* Avatar Circle with initials */}
                <View style={[styles.avatarCircle, { backgroundColor: '#CCFBF1' }]}>
                  <ThemedText style={[styles.avatarText, { color: '#0F766E' }]}>
                    {getInitials(currentParent.name)}
                  </ThemedText>
                </View>

                {/* Parent Name & Badges */}
                <View style={styles.headerInfo}>
                  <ThemedText style={[styles.parentName, { color: colors.text }]} numberOfLines={2}>
                    {currentParent.name}
                  </ThemedText>

                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.roleBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <ThemedText style={[styles.roleBadgeText, { color: '#059669' }]}>
                        Parent / Guardian
                      </ThemedText>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                      <ThemedText style={[styles.statusBadgeText, { color: '#059669' }]}>
                        Active
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Tablet Inline Meta Details (matches desktop/tablet screenshot) */}
              {isTablet && (
                <View style={[styles.tabletDetailsRow, { borderTopColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                  {/* Parent Login ID */}
                  <View style={styles.tabletDetailItem}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="person-outline" size={13} color="#10B981" />
                    </View>
                    <View>
                      <ThemedText style={[styles.detailLabelSmall, { color: colors.textSecondary }]}>
                        Parent Login ID
                      </ThemedText>
                      <View style={styles.valWithCopy}>
                        <ThemedText style={[styles.detailValueSmall, { color: colors.text }]}>
                          {displayParentId}
                        </ThemedText>
                        <TouchableOpacity onPress={() => handleCopy(displayParentId, 'Parent Login ID')}>
                          <Ionicons 
                            name={copiedField === 'Parent Login ID' ? "checkmark-circle" : "copy-outline"} 
                            size={13} 
                            color={copiedField === 'Parent Login ID' ? '#10B981' : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Email Address */}
                  <View style={styles.tabletDetailItem}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="mail-outline" size={13} color="#10B981" />
                    </View>
                    <View>
                      <ThemedText style={[styles.detailLabelSmall, { color: colors.textSecondary }]}>
                        Email Address
                      </ThemedText>
                      <View style={styles.valWithCopy}>
                        <ThemedText style={[styles.detailValueSmall, { color: colors.text }]} numberOfLines={1}>
                          {currentParent.email || '—'}
                        </ThemedText>
                        {!!currentParent.email && (
                          <TouchableOpacity onPress={() => handleCopy(currentParent.email, 'Email Address')}>
                            <Ionicons 
                              name={copiedField === 'Email Address' ? "checkmark-circle" : "copy-outline"} 
                              size={13} 
                              color={copiedField === 'Email Address' ? '#10B981' : colors.textSecondary} 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Phone Number */}
                  {!!currentParent.phone && (
                    <View style={styles.tabletDetailItem}>
                      <View style={[styles.iconBoxSmall, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="call-outline" size={13} color="#10B981" />
                      </View>
                      <View>
                        <ThemedText style={[styles.detailLabelSmall, { color: colors.textSecondary }]}>
                          Phone Number
                        </ThemedText>
                        <View style={styles.valWithCopy}>
                          <ThemedText style={[styles.detailValueSmall, { color: colors.text }]}>
                            {currentParent.phone}
                          </ThemedText>
                          <TouchableOpacity onPress={() => handleCopy(currentParent.phone, 'Phone Number')}>
                            <Ionicons 
                              name={copiedField === 'Phone Number' ? "checkmark-circle" : "copy-outline"} 
                              size={13} 
                              color={copiedField === 'Phone Number' ? '#10B981' : colors.textSecondary} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Right Col on Tablet: Illustration & Subtitle matching web screenshot */}
            {isLargeTablet && (
              <View style={styles.illustrationCol}>
                <ThemedText style={[styles.illustrationQuote, { color: colors.textSecondary }]}>
                  Together for a Brighter Tomorrow
                </ThemedText>
                <Image
                  source={require('@/../assets/images/admin/parenttop.avif')}
                  style={styles.illustrationImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          {/* Mobile Stacked 3 Detail Rows */}
          {!isTablet && (
            <>
              <View style={[styles.cardDivider, { borderBottomColor: isDark ? '#374151' : '#F1F5F9' }]} />
              <View style={styles.detailsList}>
                {/* Row 1: Parent Login ID */}
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="person-outline" size={16} color="#10B981" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Parent Login ID
                    </ThemedText>
                    <View style={styles.valWithCopy}>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {displayParentId}
                      </ThemedText>
                      <TouchableOpacity 
                        onPress={() => handleCopy(displayParentId, 'Parent Login ID')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons 
                          name={copiedField === 'Parent Login ID' ? "checkmark-circle" : "copy-outline"} 
                          size={15} 
                          color={copiedField === 'Parent Login ID' ? '#10B981' : colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Row 2: Email Address */}
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="mail-outline" size={16} color="#10B981" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Email Address
                    </ThemedText>
                    <View style={styles.valWithCopy}>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                        {currentParent.email || '—'}
                      </ThemedText>
                      {currentParent.email ? (
                        <TouchableOpacity 
                          onPress={() => handleCopy(currentParent.email, 'Email Address')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons 
                            name={copiedField === 'Email Address' ? "checkmark-circle" : "copy-outline"} 
                            size={15} 
                            color={copiedField === 'Email Address' ? '#10B981' : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Row 3: Phone Number */}
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="call-outline" size={16} color="#10B981" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Phone Number
                    </ThemedText>
                    <View style={styles.valWithCopy}>
                      <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                        {currentParent.phone || '—'}
                      </ThemedText>
                      {currentParent.phone ? (
                        <TouchableOpacity 
                          onPress={() => handleCopy(currentParent.phone, 'Phone Number')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons 
                            name={copiedField === 'Phone Number' ? "checkmark-circle" : "copy-outline"} 
                            size={15} 
                            color={copiedField === 'Phone Number' ? '#10B981' : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 3. Horizontal Tab Bar matching screenshot */}
        <View style={[styles.tabBarContainer, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && [styles.activeTabItem, { backgroundColor: '#059669' }]
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: isActive ? '#FFFFFF' : colors.textSecondary },
                      isActive && styles.activeTabLabel
                    ]}
                  >
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'overview' && (
            <ParentOverviewTab
              parent={currentParent}
              canEdit={canEdit}
              onUpdated={(updated) => {
                setCurrentParent(updated);
                if (onRefresh) onRefresh();
              }}
              onLinkChildClick={onLinkChildClick}
              onUnlinkChildClick={onUnlinkChildClick}
            />
          )}
          {activeTab === 'children' && (
            <ParentChildrenTab
              parent={currentParent}
              canEdit={canEdit}
              onLinkChildClick={onLinkChildClick}
              onUnlinkChildClick={onUnlinkChildClick}
            />
          )}
          {activeTab === 'fees' && (
            <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border || '#E5E7EB' }]}>
              <Ionicons name="card-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Fee ledger and transaction statements are accessible in Fees tab.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Action Modal for 3-dot options */}
      <ProfileActionsModal
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        title={currentParent.name}
        subtitle="Parent Actions"
        actions={menuActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabletEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: 12,
  },
  tabletEditBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTopRowTablet: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeftCol: {
    minWidth: 0,
  },
  avatarAndTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  parentName: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabletDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tabletDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBoxSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabelSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailValueSmall: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  illustrationCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingLeft: 12,
  },
  illustrationQuote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 4,
    maxWidth: 130,
  },
  illustrationImage: {
    width: 140,
    height: 100,
  },
  cardDivider: {
    borderBottomWidth: 1,
    marginVertical: 14,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  valWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  tabBarContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
  },
  tabBarScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTabItem: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '600',
  },
  tabContentContainer: {
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
