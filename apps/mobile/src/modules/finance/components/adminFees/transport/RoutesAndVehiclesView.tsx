import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface RoutesAndVehiclesViewProps {
  colors: any;
  routes: any[];
  vehicles: any[];
  onAddRoute: () => void;
  onEditRoute: (r: any) => void;
  onDeleteRoute: (id: string) => void;
  onAddVehicle: () => void;
  onEditVehicle: (v: any) => void;
  onDeleteVehicle: (id: string) => void;
}

export function RoutesAndVehiclesView({
  colors,
  routes,
  vehicles,
  onAddRoute,
  onEditRoute,
  onDeleteRoute,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: RoutesAndVehiclesViewProps) {
  return (
    <View style={{ gap: 16 }}>
      {/* ROUTES SECTION */}
      <View style={styles.sectionHeader}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Transport Routes</ThemedText>
        <TouchableOpacity style={styles.addBtn} onPress={onAddRoute}>
          <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Add Route</ThemedText>
        </TouchableOpacity>
      </View>

      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No transport routes configured.</ThemedText>
        </View>
      ) : (
        routes.map(r => (
          <View key={r.id} style={[styles.itemCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{r.name}</ThemedText>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Vehicle: {r.vehicleNumber || 'No Vehicle Assigned'}
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <ThemedText style={{ fontWeight: 'bold', color: '#007AFF', fontSize: 14 }}>₹{r.fee}/mo</ThemedText>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}
                    onPress={() => onEditRoute(r)}
                  >
                    <Ionicons name="pencil" size={12} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
                    onPress={() => onDeleteRoute(r.id)}
                  >
                    <Ionicons name="trash-outline" size={12} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))
      )}

      {/* VEHICLES SECTION */}
      <View style={styles.sectionHeader}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Vehicles Fleet</ThemedText>
        <TouchableOpacity style={styles.addBtn} onPress={onAddVehicle}>
          <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Register</ThemedText>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>No vehicles registered.</ThemedText>
        </View>
      ) : (
        vehicles.map(v => (
          <View key={v.id} style={[styles.itemCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{v.number}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: v.status === 'active' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(142, 142, 147, 0.15)' }]}>
                    <ThemedText style={[styles.statusBadgeText, { color: v.status === 'active' ? '#34C759' : '#8E8E93' }]}>{v.status}</ThemedText>
                  </View>
                </View>
                <ThemedText style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Type: {v.type} | Capacity: {v.capacity} seats
                </ThemedText>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}
                  onPress={() => onEditVehicle(v)}
                >
                  <Ionicons name="pencil" size={12} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
                  onPress={() => onDeleteVehicle(v.id)}
                >
                  <Ionicons name="trash-outline" size={12} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
