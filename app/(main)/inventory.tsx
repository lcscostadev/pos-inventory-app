import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { addProduct, getAllProducts, incrementProductStock, Product, setProductStock } from "../../db";

const colors = {
  bg: "#F5E6CC",
  card: "#FFFFFF",
  shadow: "#000000",
  primary: "#C49A6C",
  text: "#333333",
  muted: "#7A7A7A",
  border: "#E0C9A6",
  warn: "#C9A21A",   
  danger: "#C13A3A", 
};

function stockColor(stock: number) {
  if (stock < 5) return colors.danger;
  if (stock < 10) return colors.warn;
  return colors.text;
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllProducts();
      setProducts(list);
    } catch (e) {
      console.warn("Erro ao carregar produtos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onInc = async (p: Product) => {
    await incrementProductStock(p.id, +1);
    await load();
  };
  const onDec = async (p: Product) => {
    if (p.stock <= 0) return;
    await incrementProductStock(p.id, -1);
    await load();
  };
  const onSetStock = async (p: Product, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    await setProductStock(p.id, n);
    await load();
  };

  const addNew = async () => {
    try {
      const nPrice = Number(price.replace(",", "."));
      const nCost = Number(cost.replace(",", "."));
      const nStock = Math.max(0, Math.floor(Number(stock) || 0));

      if (!name.trim()) return Alert.alert("Validação", "Informe o nome.");
      if (!(nPrice > 0)) return Alert.alert("Validação", "Preço inválido.");
      if (!(nCost >= 0)) return Alert.alert("Validação", "Custo inválido.");

      await addProduct({ name: name.trim(), price: nPrice, cost: nCost, stock: nStock });
      setName(""); setPrice(""); setCost(""); setStock("");
      await load();
      Alert.alert("Produto", "Cadastrado com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível adicionar o produto.");
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtitle}>Preço: R$ {item.price.toFixed(2)} • Custo: R$ {item.cost.toFixed(2)}</Text>
        </View>

        <View style={styles.stockCol}>
          <Text style={[styles.stockLabel, { color: stockColor(item.stock) }]}>
            Estoque: {item.stock}
          </Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => onDec(item)} style={styles.stepBtn}>
              <Text style={styles.stepText}>-</Text>
            </TouchableOpacity>
            <TextInput
              defaultValue={String(item.stock)}
              keyboardType="number-pad"
              returnKeyType="done"
              onEndEditing={(e) => onSetStock(item, e.nativeEvent.text)}
              style={styles.stockInput}
            />
            <TouchableOpacity onPress={() => onInc(item)} style={styles.stepBtn}>
              <Text style={styles.stepText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* <Text style={styles.header}>Estoque</Text> */}

        <View style={styles.form}>
          <Text style={styles.formTitle}>Novo produto</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="Nome"
              value={name}
              onChangeText={setName}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              placeholder="Preço (ex.: 10,00)"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Custo (ex.: 4,00)"
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Estoque inicial"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
              style={[styles.input, { width: 140 }]}
              placeholderTextColor={colors.muted}
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addNew}>
            <Text style={styles.addText}>ADICIONAR</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 16 }}>
              Nenhum produto cadastrado.
            </Text>
          }
          refreshing={loading}
          onRefresh={load}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  header: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 12 },

  form: {
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  formTitle: { fontWeight: "800", color: colors.text, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  addBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addText: { color: "#fff", fontWeight: "800" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.muted },
  stockCol: { alignItems: "flex-end" },
  stockLabel: { fontWeight: "800", marginBottom: 6 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EA",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    height: 36,
  },
  stepBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 18, color: colors.text, fontWeight: "800" },
  stockInput: {
    width: 64,
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
    paddingVertical: 6,
    color: colors.text,
    fontWeight: "700",
  },
});