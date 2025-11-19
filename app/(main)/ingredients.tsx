import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addIngredient,
  addIngredientPurchase,
  deleteIngredient,
  incrementIngredientQty,
  listIngredients,
  setIngredientQty,
  setIngredientUnitPrice,
  updateIngredient,
  type Ingredient,
} from "../../db";

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

function stockColor(qty: number) {
  if (qty < 5) return colors.danger;
  if (qty < 10) return colors.warn;
  return colors.text;
}

export default function IngredientsScreen() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<{
    id: string;
    name: string;
    unit: string;
    unit_price: string;
    qty: string;
  } | null>(null);

  // modal entrada (compra)
  const [purchaseOpen, setPurchaseOpen] = useState<{
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
  } | null>(null);
  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listIngredients();
      setItems(list);
    } catch (e) {
      console.warn("Erro ao carregar ingredientes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addNew = async () => {
    try {
      if (!name.trim()) return Alert.alert("Validação", "Informe o nome.");
      const up = Number((unitPrice || "").replace(",", "."));
      const q = Number(qty || "0");
      if (!(up >= 0)) return Alert.alert("Validação", "Preço unitário inválido.");
      if (!(q >= 0)) return Alert.alert("Validação", "Quantidade inválida.");

      await addIngredient({
        name: name.trim(),
        unit: unit.trim() || "un",
        unit_price: up,
        qty: q,
      });

      setName("");
      setUnit("g");
      setUnitPrice("");
      setQty("");
      await load();
      Alert.alert("Ingrediente", "Cadastrado com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível adicionar.");
    }
  };

  const onInc = async (ing: Ingredient) => {
    await incrementIngredientQty(ing.id, +1);
    await load();
  };

  const onDec = async (ing: Ingredient) => {
    if (ing.qty <= 0) return;
    await incrementIngredientQty(ing.id, -1);
    await load();
  };

  const onSetQty = async (ing: Ingredient, value: string) => {
    const n = Math.max(0, Number(value) || 0);
    await setIngredientQty(ing.id, n);
    await load();
  };

  const askDelete = (ing: Ingredient) => {
    Alert.alert(
      "Excluir ingrediente",
      `Tem certeza que deseja excluir "${ing.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIngredient(ing.id);
              await load();
              Alert.alert("Ingrediente", "Excluído com sucesso.");
            } catch (e: any) {
              Alert.alert("Não foi possível excluir", e?.message ?? "Tente novamente.");
            }
          },
        },
      ]
    );
  };

  const openEdit = (ing: Ingredient) => {
    setEdit({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      unit_price: String(ing.unit_price).replace(".", ","),
      qty: String(ing.qty),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!edit) return;
    try {
      await updateIngredient({
        id: edit.id,
        name: edit.name,
        unit: edit.unit,
        unit_price: Number(edit.unit_price.replace(",", ".")),
        qty: Math.max(0, Number(edit.qty) || 0),
      });
      setEditOpen(false);
      setEdit(null);
      await load();
      Alert.alert("Ingrediente", "Atualizado com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro ao atualizar", e?.message ?? "Tente novamente.");
    }
  };

  const openPurchase = (ing: Ingredient) => {
    setPurchaseOpen({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      unitPrice: ing.unit_price,
    });
    setPurchaseQty("");
    setPurchaseUnitPrice(String(ing.unit_price).replace(".", ","));
  };

  const savePurchase = async () => {
    if (!purchaseOpen) return;
    try {
      const q = Number((purchaseQty || "").replace(",", "."));
      const up = Number((purchaseUnitPrice || "").replace(",", "."));
      if (!(q > 0)) return Alert.alert("Validação", "Quantidade inválida.");
      if (!(up >= 0)) return Alert.alert("Validação", "Preço unitário inválido.");

      // 1) registra compra + incrementa estoque + atualiza unit_cost
      await addIngredientPurchase({
        ingredient_id: purchaseOpen.id,
        qty: q,
        unit_price: up,
      });

      await setIngredientUnitPrice(purchaseOpen.id, up);

      setPurchaseOpen(null);
      await load();
      Alert.alert("Entrada registrada", "Compra lançada e estoque atualizado.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível registrar a entrada.");
    }
  };

  const renderItem = ({ item }: { item: Ingredient }) => (
    <Pressable onLongPress={() => openEdit(item)}>
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtitle}>
            Unidade: {item.unit} • Preço un.: R$ {item.unit_price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.stockCol}>
          <Text style={[styles.stockLabel, { color: stockColor(item.qty) }]}>
            Estoque: {item.qty} {item.unit}
          </Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => onDec(item)} style={styles.stepBtn}>
              <Text style={styles.stepText}>-</Text>
            </TouchableOpacity>
            <TextInput
              defaultValue={String(item.qty)}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onEndEditing={(e) => onSetQty(item, e.nativeEvent.text)}
              style={styles.stockInput}
            />
            <TouchableOpacity onPress={() => onInc(item)} style={styles.stepBtn}>
              <Text style={styles.stepText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ações: entrada (compra) e excluir */}
        <View style={{ marginLeft: 8, alignItems: "center", gap: 6 }}>
          <TouchableOpacity onPress={() => openPurchase(item)} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => askDelete(item)} style={[styles.smallBtn, { backgroundColor: "#d9534f" }]}>
            <Text style={[styles.smallBtnText, { color: "#fff" }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>Novo ingrediente</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Nome (ex.: Farinha)"
            value={name}
            onChangeText={setName}
            style={[styles.input, { flex: 1 }]}
            placeholderTextColor={colors.muted}
          />
          <TextInput
            placeholder="Unidade (ex.: kg, un)"
            value={unit}
            onChangeText={setUnit}
            style={[styles.input, { width: 110 }]}
            placeholderTextColor={colors.muted}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            placeholder="Preço por unidade (ex.: 12,50)"
            value={unitPrice}
            onChangeText={setUnitPrice}
            keyboardType="decimal-pad"
            style={[styles.input, { flex: 1 }]}
            placeholderTextColor={colors.muted}
          />
          <TextInput
            placeholder="Quantidade inicial"
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            style={[styles.input, { width: 160 }]}
            placeholderTextColor={colors.muted}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addNew}>
          <Text style={styles.addText}>ADICIONAR</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 16 }}>
            Nenhum ingrediente cadastrado.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Editar ingrediente</Text>
            <TextInput
              placeholder="Nome"
              value={edit?.name ?? ""}
              onChangeText={(t) => setEdit((s) => (s ? { ...s, name: t } : s))}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="Unidade"
                value={edit?.unit ?? ""}
                onChangeText={(t) => setEdit((s) => (s ? { ...s, unit: t } : s))}
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor={colors.muted}
              />
              <TextInput
                placeholder="Preço por unidade"
                value={edit?.unit_price ?? ""}
                onChangeText={(t) => setEdit((s) => (s ? { ...s, unit_price: t } : s))}
                keyboardType="decimal-pad"
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor={colors.muted}
              />
            </View>
            <TextInput
              placeholder="Quantidade"
              value={edit?.qty ?? ""}
              onChangeText={(t) => setEdit((s) => (s ? { ...s, qty: t } : s))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={[styles.modalBtn, { backgroundColor: "#ddd" }]}>
                <Text style={[styles.modalBtnText, { color: "#333" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.modalBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!purchaseOpen} transparent animationType="fade" onRequestClose={() => setPurchaseOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPurchaseOpen(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Entrada de ingrediente</Text>
            <Text style={{ color: colors.muted, marginBottom: 8 }}>
              {purchaseOpen?.name} ({purchaseOpen?.unit})
            </Text>
            <View style={styles.row}>
              <TextInput
                placeholder="Quantidade comprada"
                value={purchaseQty}
                onChangeText={setPurchaseQty}
                keyboardType="decimal-pad"
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor={colors.muted}
              />
              <TextInput
                placeholder="Preço por unidade (ex.: 12,50)"
                value={purchaseUnitPrice}
                onChangeText={setPurchaseUnitPrice}
                keyboardType="decimal-pad"
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPurchaseOpen(null)} style={[styles.modalBtn, { backgroundColor: "#ddd" }]}>
                <Text style={[styles.modalBtnText, { color: "#333" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={savePurchase} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.modalBtnText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },

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

  stockCol: { alignItems: "flex-end", marginLeft: 8 },
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
    width: 80,
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

  smallBtn: {
    backgroundColor: "#eee",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: { color: colors.text, fontWeight: "700", fontSize: 12 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", alignItems: "center" },
  modalCard: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  modalTitle: { fontWeight: "800", color: colors.text, marginBottom: 8, fontSize: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  modalBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  modalBtnText: { color: "#fff", fontWeight: "800" },
});