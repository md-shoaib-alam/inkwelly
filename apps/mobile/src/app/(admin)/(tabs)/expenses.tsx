import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { FAB, Portal, Dialog, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/store/auth-context';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/store/settings-context';
import { hasPermission } from '@/lib/permissions';

// Subcomponents
import { CategoryInfo, ExpenseInfo, ExpenseStats, executeGraphQL } from '@/components/admin/expenses/types';
import { ExpenseCard } from '@/components/admin/expenses/ExpenseCard';
import { AddExpenseDialog } from '@/components/admin/expenses/AddExpenseDialog';
import { ExpenseStatsView } from '@/components/admin/expenses/ExpenseStatsView';

export default function ExpensesScreen() {
  const { user } = useAuth();
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];

  const [expenses, setExpenses] = useState<ExpenseInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters & Pagination state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog and form states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseInfo | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    paymentMethod: 'cash',
    referenceNo: '',
    status: 'paid',
  });
  const [savingExpense, setSavingExpense] = useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dropdown UI states
  const [filterCategorySelectOpen, setFilterCategorySelectOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canCreateExpense = isAdmin || hasPermission(user, 'expenses', 'create');
  const canEditExpense = isAdmin || hasPermission(user, 'expenses', 'edit');
  const canDeleteExpense = isAdmin || hasPermission(user, 'expenses', 'delete');

  // Fetch Core Data
  const fetchCategories = useCallback(async () => {
    try {
      const q = `
        query GetExpenseCategories {
          expenseCategories {
            id
            name
            description
          }
        }
      `;
      const data = await executeGraphQL(q);
      setCategories(data.expenseCategories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const q = `
        query GetExpenseStats {
          expenseStats {
            totalExpenses
            thisMonthExpenses
            prevMonthExpenses
            categoryWiseExpenses {
              categoryId
              categoryName
              amount
            }
          }
        }
      `;
      const data = await executeGraphQL(q);
      setStats(data.expenseStats || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchExpenses = useCallback(async (pageNum: number, shouldAppend: boolean = false, isRefreshCall: boolean = false) => {
    try {
      if (pageNum === 1 && !isRefreshCall) setIsLoading(true);
      else if (pageNum > 1) setIsLoadingMore(true);

      const q = `
        query GetExpenses($categoryId: String, $status: String, $page: Int, $limit: Int) {
          expenses(categoryId: $categoryId, status: $status, page: $page, limit: $limit) {
            items {
              id
              amount
              date
              description
              paymentMethod
              referenceNo
              status
              category {
                id
                name
              }
            }
            total
            page
            totalPages
          }
        }
      `;

      const vars = {
        categoryId: categoryFilter === 'all' ? null : categoryFilter,
        status: statusFilter === 'all' ? null : statusFilter,
        page: pageNum,
        limit: 15,
      };

      const data = await executeGraphQL(q, vars);
      const items = data.expenses?.items || [];
      const totalPagesNum = data.expenses?.totalPages || 1;

      if (shouldAppend) {
        setExpenses((prev) => [...prev, ...items]);
      } else {
        setExpenses(items);
      }
      setTotalPages(totalPagesNum);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [categoryFilter, statusFilter]);

  // Initial and dependent loading
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  useEffect(() => {
    fetchExpenses(1, false);
  }, [fetchExpenses]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
    fetchCategories();
    fetchExpenses(1, false, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore && !isLoading) {
      fetchExpenses(page + 1, true);
    }
  };

  // Submit Category
  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('Validation Error', 'Please specify a category name.');
      return;
    }
    setCreatingCategory(true);
    try {
      const q = `
        mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {
          createExpenseCategory(input: $input) {
            id
            name
          }
        }
      `;
      await executeGraphQL(q, { input: { name: categoryForm.name.trim(), description: categoryForm.description.trim() } });
      Alert.alert('Success', 'Category added successfully');
      setCategoryForm({ name: '', description: '' });
      setCategoryOpen(false);
      fetchCategories();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Submit Expense
  const handleExpenseSubmit = async () => {
    const amountVal = parseFloat(expenseForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than zero.');
      return;
    }
    if (!expenseForm.categoryId) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expenseForm.date)) {
      Alert.alert('Validation Error', 'Date must be formatted as YYYY-MM-DD.');
      return;
    }

    setSavingExpense(true);
    try {
      const payload = {
        amount: amountVal,
        date: expenseForm.date,
        description: expenseForm.description.trim() || null,
        categoryId: expenseForm.categoryId,
        paymentMethod: expenseForm.paymentMethod,
        referenceNo: expenseForm.referenceNo.trim() || null,
        status: expenseForm.status,
      };

      if (editingExpense) {
        const q = `
          mutation UpdateExpense($id: String!, $input: CreateExpenseInput!) {
            updateExpense(id: $id, input: $input) {
              id
              amount
            }
          }
        `;
        await executeGraphQL(q, { id: editingExpense.id, input: payload });
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        const q = `
          mutation CreateExpense($input: CreateExpenseInput!) {
            createExpense(input: $input) {
              id
              amount
            }
          }
        `;
        await executeGraphQL(q, { input: payload });
        Alert.alert('Success', 'Expense added successfully');
      }

      setExpenseOpen(false);
      setEditingExpense(null);
      setExpenseForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        paymentMethod: 'cash',
        referenceNo: '',
        status: 'paid',
      });
      handleRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete Expense
  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      const q = `
        mutation DeleteExpense($id: String!) {
          deleteExpense(id: $id)
        }
      `;
      await executeGraphQL(q, { id: expenseToDelete.id });
      setDeleteConfirmVisible(false);
      setExpenseToDelete(null);
      Alert.alert('Deleted', 'Expense record removed successfully.');
      handleRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEdit = (expense: ExpenseInfo) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description || '',
      categoryId: expense.category?.id || '',
      paymentMethod: expense.paymentMethod || 'cash',
      referenceNo: expense.referenceNo || '',
      status: expense.status || 'paid',
    });
    setExpenseOpen(true);
  };

  return (
    <ThemedView style={styles.container}>
      <FlashList
        data={expenses}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <ExpenseStatsView stats={stats} colors={colors} />

            {/* Filter Triggers Header */}
            <View style={styles.filterSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Filters</ThemedText>
              
              <View style={styles.filterRow}>
                {/* Category Dropdown Toggle */}
                <TouchableOpacity 
                  style={[styles.dropdownButton, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
                  onPress={() => setFilterCategorySelectOpen(true)}
                >
                  <Ionicons name="funnel-outline" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.dropdownText, { color: colors.text }]}>
                    {categoryFilter === 'all' 
                      ? 'All Categories' 
                      : categories.find(c => c.id === categoryFilter)?.name || 'Category'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Clear Filters Button if active */}
                {(categoryFilter !== 'all' || statusFilter !== 'all') && (
                  <TouchableOpacity 
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <ThemedText style={styles.clearFiltersText}>Clear</ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Horizontal Tabs Filter */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.statusScroll}
              >
                {['all', 'paid', 'pending'].map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(status)}
                      style={[
                        styles.statusTab,
                        isActive 
                          ? { backgroundColor: '#FF3B30' } 
                          : { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }
                      ]}
                    >
                      <ThemedText style={[
                        styles.statusTabText,
                        { color: isActive ? '#FFFFFF' : colors.text }
                      ]}>
                        {status.toUpperCase()}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Expenses List Title */}
            <View style={styles.listHeaderRow}>
              <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Expense Ledger</ThemedText>
              {canCreateExpense && (
                <TouchableOpacity 
                  style={styles.addCategoryHeaderButton}
                  onPress={() => setCategoryOpen(true)}
                >
                  <Ionicons name="add" size={14} color="#007AFF" />
                  <ThemedText style={styles.addCategoryHeaderText}>Add Category</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ExpenseCard
            item={item}
            colors={colors}
            isAdmin={canEditExpense || canDeleteExpense}
            onEdit={() => {
              if (!canEditExpense) {
                Alert.alert('Permission Denied', 'You do not have permission to edit expenses.');
                return;
              }
              handleOpenEdit(item);
            }}
            onDelete={() => {
              if (!canDeleteExpense) {
                Alert.alert('Permission Denied', 'You do not have permission to delete expenses.');
                return;
              }
              setExpenseToDelete(item);
              setDeleteConfirmVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF3B30" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
                No expenses found matching the criteria.
              </ThemedText>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#FF3B30" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {canCreateExpense && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: '#FF3B30' }]}
          color="#FFFFFF"
          onPress={() => {
            setEditingExpense(null);
            setExpenseForm({
              amount: '',
              date: new Date().toISOString().split('T')[0],
              description: '',
              categoryId: categories[0]?.id || '',
              paymentMethod: 'cash',
              referenceNo: '',
              status: 'paid',
            });
            setExpenseOpen(true);
          }}
        />
      )}

      {/* FILTER CATEGORY SELECT DIALOG */}
      <Portal>
        <Dialog 
          visible={filterCategorySelectOpen} 
          onDismiss={() => setFilterCategorySelectOpen(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Category Filter</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView>
              <TouchableOpacity 
                style={styles.dialogSelectRow}
                onPress={() => {
                  setCategoryFilter('all');
                  setFilterCategorySelectOpen(false);
                }}
              >
                <ThemedText style={{ color: categoryFilter === 'all' ? '#007AFF' : colors.text }}>
                  All Categories
                </ThemedText>
                {categoryFilter === 'all' && <Ionicons name="checkmark" size={18} color="#007AFF" />}
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id}
                  style={styles.dialogSelectRow}
                  onPress={() => {
                    setCategoryFilter(cat.id);
                    setFilterCategorySelectOpen(false);
                  }}
                >
                  <ThemedText style={{ color: categoryFilter === cat.id ? '#007AFF' : colors.text }}>
                    {cat.name}
                  </ThemedText>
                  {categoryFilter === cat.id && <Ionicons name="checkmark" size={18} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setFilterCategorySelectOpen(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ADD EXPENSE CATEGORY DIALOG */}
      <Portal>
        <Dialog 
          visible={categoryOpen} 
          onDismiss={() => setCategoryOpen(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Add Expense Category</Dialog.Title>
          <Dialog.Content style={{ gap: 14 }}>
            <View>
              <ThemedText style={styles.dialogInputLabel}>Category Name *</ThemedText>
              <TextInput
                value={categoryForm.name}
                onChangeText={(t) => setCategoryForm(prev => ({ ...prev, name: t }))}
                placeholder="e.g. Utilities, Stationery"
                placeholderTextColor={colors.textSecondary}
                style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />
            </View>
            <View>
              <ThemedText style={styles.dialogInputLabel}>Description</ThemedText>
              <TextInput
                value={categoryForm.description}
                onChangeText={(t) => setCategoryForm(prev => ({ ...prev, description: t }))}
                placeholder="Brief category context..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.dialogInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.backgroundSelected }]}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} onPress={() => setCategoryOpen(false)}>Cancel</Button>
            <Button 
              textColor="#007AFF" 
              loading={creatingCategory}
              disabled={creatingCategory}
              onPress={handleCategorySubmit}
            >
              Add Category
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ADD / EDIT EXPENSE DIALOG */}
      <AddExpenseDialog
        visible={expenseOpen}
        onDismiss={() => setExpenseOpen(false)}
        colors={colors}
        editingExpense={editingExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        categories={categories}
        savingExpense={savingExpense}
        onSubmit={handleExpenseSubmit}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <Portal>
        <Dialog 
          visible={deleteConfirmVisible} 
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Dialog.Title style={{ color: colors.text }}>Delete Expense</Dialog.Title>
          <Dialog.Content>
            <ThemedText style={{ color: colors.text }}>
              Are you sure you want to permanently delete this expense of ₹{expenseToDelete?.amount.toLocaleString()}? This action is irreversible.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={colors.textSecondary} disabled={deleting} onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button 
              textColor="#FF3B30" 
              loading={deleting}
              disabled={deleting}
              onPress={handleDeleteConfirm}
            >
              Delete
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
  headerContainer: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 8,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusScroll: {
    gap: 8,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCategoryHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addCategoryHeaderText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  dialogScroll: {
    maxHeight: 280,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dialogInputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dialogInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dialogSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
  },
});
