import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { finalizeSale } from "../../db";
import { useCartStore } from "../../store/useCartStore";
import colors from "../../theme/colors";
import { money } from "../../utils/currency";

const PIX_KEY = process.env.EXPO_PUBLIC_PIX_KEY || "";

export default function Checkout() {
  const { items, setQty, remove, clear, total } = useCartStore();
  const [zoom, setZoom] = useState(false);

  const totalValue = useMemo(() => total(), [items]);

  const copyPixKey = async () => {
    if (!PIX_KEY) {
      Alert.alert("PIX", "Nenhuma chave PIX configurada (EXPO_PUBLIC_PIX_KEY).");
      return;
    }
    await Clipboard.setStringAsync(PIX_KEY);
    Alert.alert("PIX", "Chave PIX copiada para a área de transferência.");
  };

  const confirm = async () => {
    if (items.length === 0) {
      Alert.alert("Carrinho vazio", "Adicione itens antes de confirmar.");
      return;
    }
    try {
      const payload = items.map((i) => ({
        productId: i.id,
        qty: i.qty,
        unitPrice: i.price,
      }));

      await finalizeSale(payload); 
      clear();

      Alert.alert("Venda concluída", "Estoque atualizado e venda registrada.");
      router.replace("/(main)"); 
    } catch (e: any) {
      Alert.alert("Erro ao salvar", e?.message ?? "Tente novamente.");
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Checkout</Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{money(item.price)}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setQty(item.id, item.qty - 1)} style={styles.stepBtn}>
                <Text style={styles.stepText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.qty}</Text>
              <TouchableOpacity onPress={() => setQty(item.id, item.qty + 1)} style={styles.stepBtn}>
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)} style={styles.remove}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>x</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>Nenhum item no carrinho.</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pagamento via PIX</Text>
        <Text style={styles.help}>
          Peça para o cliente escanear o QR Code abaixo. Em seguida, ele deve DIGITAR o valor indicado.
        </Text>

        <Pressable onPress={() => setZoom(true)} style={styles.qrTouch}>
          <Image
            source={require("../../assets/images/pix_qr.png")}
            style={styles.qr}
            resizeMode="contain"
          />
          <Text style={styles.tapHint}>Toque para ampliar</Text>
        </Pressable>

        {!!PIX_KEY && (
          <TouchableOpacity style={styles.copyBtn} onPress={copyPixKey}>
            <Text style={styles.copyText}>Copiar chave PIX</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.totalRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{money(totalValue)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, totalValue === 0 && { opacity: 0.6 }]}
          onPress={confirm}
          disabled={totalValue === 0}
        >
          <Text style={styles.confirmText}>CONFIRMAR</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <View style={styles.modalBg}>
          <Pressable style={styles.modalBg} onPress={() => setZoom(false)}>
            <Image
              source={require("../../assets/images/pix_qr.png")}
              style={styles.qrBig}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontWeight: "700", color: colors.text },
  price: { color: colors.muted },

  stepper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8F3EA", borderRadius: 999, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 8, height: 32, marginRight: 8,
  },
  stepBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 18, color: colors.text, fontWeight: "700" },
  qty: { minWidth: 18, textAlign: "center", fontWeight: "700", color: colors.text },
  remove: { backgroundColor: "#d9534f", paddingHorizontal: 8, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginTop: 6,
  },
  cardTitle: { fontWeight: "800", color: colors.text, marginBottom: 8 },
  help: { color: colors.muted, marginBottom: 10 },

  qrTouch: { alignItems: "center", justifyContent: "center" },
  qr: { width: 200, height: 200 },
  tapHint: { marginTop: 6, color: colors.muted, fontSize: 12 },

  copyBtn: { backgroundColor: colors.primary, borderRadius: 8, alignItems: "center", padding: 10, marginTop: 10 },
  copyText: { color: "#fff", fontWeight: "800" },

  totalRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  totalBox: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border,
  },
  totalLabel: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  totalValue: { color: colors.text, fontWeight: "800", fontSize: 16 },
  confirmBtn: { backgroundColor: colors.primary, paddingHorizontal: 22, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  confirmText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center" },
  qrBig: { width: "85%", height: "85%" },
});
