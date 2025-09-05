import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllProducts, Product } from "../../db";
import { useCartStore } from "../../store/useCartStore";

const colors = {
  bg: "#F5E6CC",
  card: "#FFFFFF",
  shadow: "#000000",
  primary: "#C49A6C",
  text: "#333333",
  muted: "#7A7A7A",
  border: "#E0C9A6",
};

function stockColor(stock: number) {
  if (stock < 5) return "#C13A3A";   
  if (stock < 10) return "#C9A21A"; 
  return "#333333";                  
}

export default function CatalogScreen() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({}); 
  const setFromMap = useCartStore((s) => s.setFromMap);

  const load = useCallback(async () => {
    try {
      const list = await getAllProducts();
      setProducts(list);
      setQty((prev) => {
        const next = { ...prev };
        for (const p of list) {
          const selected = next[p.id] || 0;
          if (selected > p.stock) next[p.id] = p.stock;
        }
        return next;
      });
    } catch (e) {
      console.warn("Erro ao carregar produtos:", e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, products]);

  const total = useMemo(() => {
    return Object.entries(qty).reduce((acc, [id, q]) => {
      const p = products.find((x) => x.id === id);
      if (!p) return acc;
      return acc + p.price * q;
    }, 0);
  }, [qty, products]);

  const inc = (p: Product) =>
    setQty((s) => {
      const cur = s[p.id] ?? 0;
      if (cur >= p.stock) {
        Alert.alert("Estoque insuficiente", `Restam apenas ${p.stock} unidades.`);
        return s;
      }
      return { ...s, [p.id]: cur + 1 };
    });

  const dec = (id: string) =>
    setQty((s) => {
      const next = Math.max(0, (s[id] ?? 0) - 1);
      return { ...s, [id]: next };
    });

  const renderItem = ({ item }: { item: Product }) => {
    const count = qty[item.id] ?? 0;
    const remaining = item.stock - count;

    return (
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/biscoito.png")}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <Text style={[styles.price, { marginRight: 6 }]}>R$ {item.price}</Text>
            <Text style={[styles.stockInfo, { color: stockColor(item.stock) }]}>
              • Em estoque: {item.stock}
            </Text>
            {count > 0 && (
              <Text style={[styles.stockInfo, { color: stockColor(remaining) }]}>
                • Restante: {remaining}
              </Text>
            )}
          </View>

          <View style={styles.rowBetween}>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => dec(item.id)} style={styles.stepBtn}>
                <Text style={styles.stepText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{count}</Text>
              <TouchableOpacity onPress={() => inc(item)} style={styles.stepBtn}>
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const onBuy = () => {
    const map: Record<string, { name: string; price: number; qty: number }> = {};
    for (const p of products) {
      const q = qty[p.id] || 0;
      if (q > 0) map[p.id] = { name: p.name, price: p.price, qty: q };
    }
    if (Object.keys(map).length === 0) {
      Alert.alert("Carrinho vazio", "Selecione ao menos 1 item.");
      return;
    }
    setFromMap(map);
    router.push("/(main)/checkout");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* <Text style={styles.header}>Catálogo</Text> */}

        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Buscar produto..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.buyBtn, total === 0 && { opacity: 0.6 }]}
            disabled={total === 0}
            onPress={onBuy}
          >
            <Text style={styles.buyText}>COMPRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  searchWrap: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    fontSize: 16,
    color: colors.text,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: { color: colors.text, fontWeight: "700" },
  stockInfo: { color: colors.muted, marginLeft: 6, fontSize: 12, fontWeight: "600" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EA",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    height: 32,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 18, color: colors.text, fontWeight: "700" },
  qtyText: {
    minWidth: 18,
    textAlign: "center",
    fontWeight: "700",
    color: colors.text,
  },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  totalBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  totalValue: { color: colors.text, fontWeight: "700", fontSize: 16 },
  buyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },
});
