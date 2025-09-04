import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

type Product = {
  id: string;
  name: string;
  price: number;
  image: any;
};

// Dados mockados
const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Amanteigado Tradicional",
    price: 10,
    image: require("../../assets/images/biscoito.png"),
  },
  {
    id: "2",
    name: "Amanteigado com Goiabada",
    price: 10,
    image: require("../../assets/images/biscoito.png"),
  },
  {
    id: "3",
    name: "Amanteigado com Chocolate",
    price: 10,
    image: require("../../assets/images/biscoito.png"),
  },
];

export default function CatalogScreen() {
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({}); // {productId: quantidade}

  // pega a ação do store para preencher o carrinho e navegar
  const setFromMap = useCartStore((s) => s.setFromMap);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const total = useMemo(() => {
    return Object.entries(qty).reduce((acc, [id, q]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return acc;
      return acc + p.price * q;
    }, 0);
  }, [qty]);

  const inc = (id: string) =>
    setQty((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setQty((s) => {
      const next = Math.max(0, (s[id] ?? 0) - 1);
      return { ...s, [id]: next };
    });

  const renderItem = ({ item }: { item: Product }) => {
    const count = qty[item.id] ?? 0;
    return (
      <View style={styles.card}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.price}>R$ {item.price}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => dec(item.id)} style={styles.stepBtn}>
                <Text style={styles.stepText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{count}</Text>
              <TouchableOpacity onPress={() => inc(item.id)} style={styles.stepBtn}>
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const onBuy = () => {
    // monta o "mapa" {id: {name, price, qty}} apenas com itens > 0
    const map: Record<string, { name: string; price: number; qty: number }> = {};
    for (const p of PRODUCTS) {
      const q = qty[p.id] || 0;
      if (q > 0) {
        map[p.id] = { name: p.name, price: p.price, qty: q };
      }
    }

    // preenche o carrinho global e navega para o checkout
    setFromMap(map);
    router.push("/(main)/checkout");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header simples */}
        <Text style={styles.header}>Catálogo</Text>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Buscar produto..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Lista */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Rodapé com total e botão */}
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
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: colors.text,
    fontWeight: "600",
  },
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
  stepText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
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
