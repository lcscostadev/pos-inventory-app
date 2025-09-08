import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import {
  getIngredientSpendTotal,
  getIngredientsInventoryValue,
  getProductsInventoryValue,
  getRecentSales,
  getRevenueTotal,
  type SaleRow,
} from "../../db";
import colors from "../../theme/colors";
import { money } from "../../utils/currency";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [revenue, setRevenue] = useState(0);
  const [ingSpend, setIngSpend] = useState(0);
  const [invProducts, setInvProducts] = useState(0);
  const [invIngredients, setInvIngredients] = useState(0);
  const [tx, setTx] = useState<SaleRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [rev, isp, invP, invI, sales] = await Promise.all([
        getRevenueTotal(),
        getIngredientSpendTotal(),
        getProductsInventoryValue(),
        getIngredientsInventoryValue(),
        getRecentSales(30),
      ]);
      setRevenue(rev);
      setIngSpend(isp);
      setInvProducts(invP);
      setInvIngredients(invI);
      setTx(sales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const profit = useMemo(() => revenue - ingSpend, [revenue, ingSpend]);
  const inventoryTotal = useMemo(
    () => invProducts + invIngredients,
    [invProducts, invIngredients]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Lucro (caixa)</Text>
          <Text style={styles.cardValue}>{money(profit)}</Text>
          <Text style={styles.smallMuted}>
            Receita {money(revenue)} − Ingred. {money(ingSpend)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Valor em estoque</Text>
          <Text style={styles.cardValue}>{money(inventoryTotal)}</Text>
          <Text style={styles.smallMuted}>
            Produtos {money(invProducts)} • Ingred. {money(invIngredients)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Transações</Text>
          <Text style={styles.cardValue}>{tx.length}</Text>
          <Text style={styles.smallMuted}>últimas {tx.length}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 12 }]}>Transações recentes</Text>
      <FlatList
        data={tx}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
              <Text style={styles.txItems}>{item.items} itens</Text>
            </View>
            <Text style={styles.txTotal}>{money(item.total)}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  cards: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardLabel: { color: colors.muted, marginBottom: 4 },
  cardValue: { fontWeight: "800", color: colors.text, fontSize: 16 },
  smallMuted: { color: colors.muted, fontSize: 12, marginTop: 4 },
  subtitle: { fontWeight: "800", color: colors.text, marginBottom: 8 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  txDate: { color: colors.text, fontWeight: "700" },
  txItems: { color: colors.muted },
  txTotal: { color: colors.text, fontWeight: "800" },
});