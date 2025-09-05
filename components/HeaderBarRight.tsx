import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNotifications } from "../store/useNotifications";

type Props = {
  name: string;
  role?: string; 
};

function timeAgo(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function HeaderBarRight({ name, role = "Administradora" }: Props) {
  const { list, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);

  const latest = useMemo(() => list.slice(0, 6), [list]);

  const onToggle = () => {
    const to = !open;
    setOpen(to);
    if (to && unread > 0) markAllRead();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.role}>{role}</Text>
      </View>

      <Image
        source={require("../assets/images/avatar.png")}
        style={styles.avatar}
      />

      <TouchableOpacity onPress={onToggle} style={styles.bellWrap} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.bell}>🔔</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Notificações</Text>
              <TouchableOpacity onPress={clear}>
                <Text style={styles.clear}>Limpar</Text>
              </TouchableOpacity>
            </View>

            {latest.length === 0 ? (
              <Text style={styles.empty}>Sem notificações</Text>
            ) : (
              latest.map((n) => (
                <View key={n.id} style={styles.item}>
                  <Text style={[styles.dot, n.type === "sale" ? styles.dotSale : styles.dotStock]}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.msg} numberOfLines={2}>
                      {n.message}
                    </Text>
                    <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                <Text style={styles.actionText}>Marcar como lidas</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity onPress={() => { setOpen(false); router.push("/(main)/notifications"); }} style={styles.actionBtn}>
                <Text style={styles.actionText}>Ver todas</Text>
              </TouchableOpacity> */}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  info: { alignItems: "flex-end", marginRight: 6, maxWidth: 180 },
  name: { fontSize: 13, fontWeight: "800", color: "#333" },
  role: { fontSize: 11, color: "#7A7A7A", marginTop: -2 },
  avatar: { width: 32, height: 32, borderRadius: 999 },
  bellWrap: { marginLeft: 6 },
  bell: { fontSize: 20, marginRight: 20 },
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#C13A3A",
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.1)" },
  dropdown: {
    position: "absolute",
    right: 12,
    top: 58, 
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0C9A6",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dropdownTitle: { fontWeight: "800", color: "#333" },
  clear: { color: "#C13A3A", fontWeight: "700" },
  empty: { color: "#7A7A7A", paddingVertical: 8 },
  item: { flexDirection: "row", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1E6D6" },
  dot: { fontSize: 18, lineHeight: 18, marginTop: 2 },
  dotSale: { color: "#2E7D32" },   // verde
  dotStock: { color: "#C9A21A" },  // amarelo
  msg: { color: "#333", fontWeight: "600" },
  time: { color: "#7A7A7A", fontSize: 11 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, paddingTop: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  actionText: { color: "#333", fontWeight: "700" },
});
