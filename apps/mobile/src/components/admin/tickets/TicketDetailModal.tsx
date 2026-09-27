import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Dialog, Portal, RadioButton, Button } from 'react-native-paper';
import { api } from '@/lib/api';
import { Ticket, TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG, TICKET_CATEGORY_CONFIG } from './types';

interface TicketDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  ticketId: string | null;
  colors: any;
  currentUser: any;
  isAdmin: boolean;
  onTicketUpdated: () => void;
}

export function TicketDetailModal({
  visible,
  onDismiss,
  ticketId,
  colors,
  currentUser,
  isAdmin,
  onTicketUpdated,
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Admin controls states
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [updating, setUpdating] = useState(false);

  // Picker dialogs visibility
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
  const [assigneePickerVisible, setAssigneePickerVisible] = useState(false);

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${ticketId}`);
      setTicket(res);
    } catch (error) {
      console.error('Failed to fetch ticket detail:', error);
      Alert.alert('Error', 'Failed to load ticket details.');
      onDismiss();
    } finally {
      setLoading(false);
    }
  }, [ticketId, onDismiss]);

  // Fetch staff list for assignment
  const fetchStaffList = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/staff', { params: { mode: 'min' } });
      setStaffList(res || []);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (visible && ticketId) {
      fetchTicketDetails();
      fetchStaffList();
    } else {
      setTicket(null);
    }
  }, [visible, ticketId, fetchTicketDetails, fetchStaffList]);

  // Reply handler
  const handleSendReply = async () => {
    if (!reply.trim() || !ticket || !currentUser) return;
    try {
      setSendingReply(true);
      await api.post(`/tickets/${ticket.id}/messages`, {
        userId: currentUser.id,
        message: reply.trim(),
      });
      setReply('');
      // Refresh ticket details to show new message
      const updated = await api.get(`/tickets/${ticket.id}`);
      setTicket(updated);
      onTicketUpdated();
    } catch (error) {
      console.error('Failed to send reply:', error);
      Alert.alert('Error', 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Update field handler
  const handleUpdateField = async (fields: Partial<Ticket>) => {
    if (!ticket) return;
    try {
      setUpdating(true);
      await api.put(`/tickets/${ticket.id}`, fields);
      // Refresh local ticket state
      const updated = await api.get(`/tickets/${ticket.id}`);
      setTicket(updated);
      onTicketUpdated();
    } catch (error) {
      console.error('Failed to update ticket field:', error);
      Alert.alert('Error', 'Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  if (!visible) return null;

  const statusCfg = ticket ? TICKET_STATUS_CONFIG[ticket.status] || { label: ticket.status, color: '#8E8E93' } : null;
  const priorityCfg = ticket ? TICKET_PRIORITY_CONFIG[ticket.priority] || { label: ticket.priority, color: '#8E8E93' } : null;
  const categoryCfg = ticket ? TICKET_CATEGORY_CONFIG[ticket.category] || { label: ticket.category, icon: 'help-circle-outline' } : null;

  // Messages in chronological order (oldest first, newer at bottom)
  const messagesList = ticket?.messages ? [...ticket.messages].reverse() : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.backgroundSelected, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={onDismiss} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="defaultSemiBold" style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {ticket?.title || 'Loading Ticket...'}
            </ThemedText>
            {statusCfg && (
              <View style={[styles.headerStatusBadge, { backgroundColor: statusCfg.color + '12' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                <ThemedText style={{ color: statusCfg.color, fontSize: 10, fontWeight: '700' }}>
                  {statusCfg.label.toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {loading && !ticket ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Ticket Info Card */}
            {ticket && (
              <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                      {categoryCfg?.label}
                    </ThemedText>
                  </View>
                  <View style={styles.infoCol}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Created</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <View style={styles.infoCol}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Priority</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: priorityCfg?.color || colors.text, fontWeight: '700' }]}>
                      {priorityCfg?.label}
                    </ThemedText>
                  </View>
                  <View style={styles.infoCol}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Assignee</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                      {ticket.assignee?.name || 'Unassigned'}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.descriptionContainer, { borderTopColor: colors.backgroundSelected }]}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</ThemedText>
                  <ThemedText style={[styles.descriptionText, { color: colors.text }]}>
                    {ticket.description}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Admin Management Section */}
            {ticket && isAdmin && (
              <View style={[styles.adminCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                <ThemedText style={[styles.adminTitle, { color: colors.text }]}>Admin Panel</ThemedText>
                
                <View style={styles.adminControlsRow}>
                  <TouchableOpacity 
                    style={[styles.adminBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                    onPress={() => setStatusPickerVisible(true)}
                  >
                    <ThemedText style={[styles.adminBtnText, { color: colors.text }]}>Status</ThemedText>
                    <Ionicons name="caret-down" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.adminBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                    onPress={() => setPriorityPickerVisible(true)}
                  >
                    <ThemedText style={[styles.adminBtnText, { color: colors.text }]}>Priority</ThemedText>
                    <Ionicons name="caret-down" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.adminBtn, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}
                    onPress={() => setAssigneePickerVisible(true)}
                  >
                    <ThemedText style={[styles.adminBtnText, { color: colors.text }]} numberOfLines={1}>
                      Assign
                    </ThemedText>
                    <Ionicons name="caret-down" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {updating && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 8 }} />}
              </View>
            )}

            {/* Conversation Thread */}
            <ThemedText type="defaultSemiBold" style={[styles.threadTitle, { color: colors.text }]}>
              Replies & Messages
            </ThemedText>

            {messagesList.length === 0 ? (
              <View style={styles.emptyThread}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.backgroundSelected} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
                  No replies yet. Type below to send a message.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.threadContainer}>
                {messagesList.map((msg) => {
                  const isOwnMessage = msg.userId === currentUser?.id;
                  
                  return (
                    <View 
                      key={msg.id} 
                      style={[
                        styles.messageRow, 
                        isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow
                      ]}
                    >
                      {!isOwnMessage && (
                        <View style={[styles.threadAvatar, { backgroundColor: colors.backgroundSelected }]}>
                          <ThemedText style={[styles.threadAvatarText, { color: colors.text }]}>
                            {msg.author.name.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                      )}
                      
                      <View style={{ maxWidth: '80%' }}>
                        {!isOwnMessage && (
                          <ThemedText style={[styles.authorLabel, { color: colors.textSecondary }]}>
                            {msg.author.name} ({msg.author.role})
                          </ThemedText>
                        )}
                        <View 
                          style={[
                            styles.bubble, 
                            isOwnMessage 
                              ? [styles.ownBubble, { backgroundColor: '#007AFF' }] 
                              : [styles.otherBubble, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]
                          ]}
                        >
                          <ThemedText style={[styles.bubbleText, { color: isOwnMessage ? '#FFF' : colors.text }]}>
                            {msg.message}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.timeLabel, isOwnMessage ? styles.ownTime : styles.otherTime, { color: colors.textSecondary }]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        {ticket && (
          <View style={[styles.inputBar, { borderTopColor: colors.backgroundSelected, backgroundColor: colors.backgroundElement }]}>
            <TextInput
              placeholder="Type your reply here..."
              placeholderTextColor={colors.textSecondary}
              value={reply}
              onChangeText={setReply}
              style={[styles.replyInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: reply.trim() ? '#007AFF' : colors.backgroundSelected }]} 
              disabled={!reply.trim() || sendingReply}
              onPress={handleSendReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={16} color={reply.trim() ? '#FFF' : colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Status Picker Dialog */}
        <Portal>
          <Dialog
            visible={statusPickerVisible}
            onDismiss={() => setStatusPickerVisible(false)}
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Dialog.Title style={{ color: colors.text }}>Update Status</Dialog.Title>
            <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
              <ScrollView>
                <RadioButton.Group 
                  onValueChange={(val) => {
                    handleUpdateField({ status: val as any });
                    setStatusPickerVisible(false);
                  }} 
                  value={ticket?.status || 'open'}
                >
                  {Object.entries(TICKET_STATUS_CONFIG).map(([key, cfg]) => (
                    <RadioButton.Item 
                      key={key}
                      label={cfg.label}
                      value={key}
                      labelStyle={{ color: colors.text }}
                      uncheckedColor={colors.textSecondary}
                      color="#007AFF"
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button textColor="#007AFF" onPress={() => setStatusPickerVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Priority Picker Dialog */}
          <Dialog
            visible={priorityPickerVisible}
            onDismiss={() => setPriorityPickerVisible(false)}
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Dialog.Title style={{ color: colors.text }}>Update Priority</Dialog.Title>
            <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
              <ScrollView>
                <RadioButton.Group 
                  onValueChange={(val) => {
                    handleUpdateField({ priority: val as any });
                    setPriorityPickerVisible(false);
                  }} 
                  value={ticket?.priority || 'medium'}
                >
                  {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, cfg]) => (
                    <RadioButton.Item 
                      key={key}
                      label={cfg.label}
                      value={key}
                      labelStyle={{ color: colors.text }}
                      uncheckedColor={colors.textSecondary}
                      color="#007AFF"
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button textColor="#007AFF" onPress={() => setPriorityPickerVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Assignee Picker Dialog */}
          <Dialog
            visible={assigneePickerVisible}
            onDismiss={() => setAssigneePickerVisible(false)}
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Dialog.Title style={{ color: colors.text }}>Assign Ticket</Dialog.Title>
            <Dialog.ScrollArea style={{ borderColor: colors.backgroundSelected, paddingHorizontal: 0 }}>
              <ScrollView>
                <RadioButton.Group 
                  onValueChange={(val) => {
                    handleUpdateField({ assignedTo: val === 'unassigned' ? null : val });
                    setAssigneePickerVisible(false);
                  }} 
                  value={ticket?.assignedTo || 'unassigned'}
                >
                  <RadioButton.Item 
                    label="Unassigned"
                    value="unassigned"
                    labelStyle={{ color: colors.text }}
                    uncheckedColor={colors.textSecondary}
                    color="#007AFF"
                  />
                  {staffList.map((staff) => (
                    <RadioButton.Item 
                      key={staff.id}
                      label={`${staff.name} (${staff.role})`}
                      value={staff.id}
                      labelStyle={{ color: colors.text }}
                      uncheckedColor={colors.textSecondary}
                      color="#007AFF"
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button textColor="#007AFF" onPress={() => setAssigneePickerVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    height: 54,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  descriptionContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  adminCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  adminTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  adminControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminBtn: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  adminBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  threadTitle: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyThread: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  threadContainer: {
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  threadAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 16,
  },
  threadAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  authorLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownBubble: {
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  timeLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  ownTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  otherTime: {
    textAlign: 'left',
    marginLeft: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
