// app/(main)/reports.tsx
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import colors from "../../theme/colors";
import { money } from "../../utils/currency";

// MOCK: depois ler de SQLite (sales / items / products)
const mockProducts = [
  { id: "1", name: "Tradicional", price: 10, cost: 4, stock: 12 },
  { id: "2", name: "Goiabada",   price: 10, cost: 4.5, stock: 8 },
  { id: "3", name: "Chocolate",  price: 10, cost: 5, stock: 15 },
];

const mockTransactions = [
  { id: "t1", date: "2025-08-28 10:12", items: 3, total: 30 },
  { id: "t2", date: "2025-08-28 14:05", items: 2, total: 20 },
  { id: "t3", date: "2025-08-29 09:20", items: 5, total: 50 },
];

export default function Reports() {
  const inventoryValue = useMemo(
    () => mockProducts.reduce((acc, p) => acc + p.stock * p.cost, 0),
    []
  );

  const revenue = useMemo(
    () => mockTransactions.reduce((acc, t) => acc + t.total, 0),
    []
  );


  const estimatedCost = revenue * 0.45; 
  const profit = revenue - estimatedCost;

  return (
    <View style={styles.wrap}>
      {/* <Text style={styles.title}>Relatórios</Text> */}

      {/* Cards */}
      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Lucro (estimado)</Text>
          <Text style={styles.cardValue}>{money(profit)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Valor em estoque</Text>
          <Text style={styles.cardValue}>{money(inventoryValue)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Transações</Text>
          <Text style={styles.cardValue}>{mockTransactions.length}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 12 }]}>Transações recentes</Text>
      <FlatList
        data={mockTransactions}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDate}>{item.date}</Text>
              <Text style={styles.txItems}>{item.items} itens</Text>
            </View>
            <Text style={styles.txTotal}>{money(item.total)}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10 },
  cards: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 12,
  },
  cardLabel: { color: colors.muted, marginBottom: 4 },
  cardValue: { fontWeight: "800", color: colors.text, fontSize: 16 },
  subtitle: { fontWeight: "800", color: colors.text, marginBottom: 8 },
  txRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  txDate: { color: colors.text, fontWeight: "700" },
  txItems: { color: colors.muted },
  txTotal: { color: colors.text, fontWeight: "800" },
});
