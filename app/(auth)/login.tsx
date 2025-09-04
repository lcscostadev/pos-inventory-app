import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../services/firebase";
import colors from "../../theme/colors";

const OWNER_EMAILS = [
  process.env.EXPO_PUBLIC_OWNER_EMAIL_DENIZE,
  process.env.EXPO_PUBLIC_OWNER_EMAIL_CELIA,
].filter(Boolean) as string[];

function keyFromEmail(email: string) {
  const safe = email.replace(/[^A-Za-z0-9._-]/g, "_");
  return `pwd.${safe}`;
}

export default function Login() {
  const hasOwners = OWNER_EMAILS.length > 0;
  const [email, setEmail] = useState<string>(hasOwners ? OWNER_EMAILS[0] : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/(main)");
    });
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      if (!email) return;
      try {
        const saved = await SecureStore.getItemAsync(keyFromEmail(email));
        setPassword(saved ?? "");
      } catch {
        setPassword("");
      }
    })();
  }, [email]);

  const ownerLabel = useMemo(() => {
    if (!email) return "";
    const lower = email.toLowerCase();
    if (lower.includes("denize")) return "Denize";
    if (lower.includes("célia") || lower.includes("celia")) return "Célia";
    return email;
  }, [email]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!email || !password) {
        Alert.alert("Preencha os campos", "Informe e-mail e senha.");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);

      const uid = cred.user?.uid;
      if (uid) {
        await SecureStore.setItemAsync(`pwd.${uid}`, password);
      }
      await SecureStore.setItemAsync(keyFromEmail(email), password);

      router.replace("/(main)");
    } catch (e: any) {
      Alert.alert("Erro ao entrar", e?.message ?? "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasOwners) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Configuração necessária</Text>
        <Text style={styles.info}>
          Defina as variáveis no arquivo .env (não versionado):
        </Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLine}>EXPO_PUBLIC_OWNER_EMAIL_DENIZE=denize@admin.com</Text>
          <Text style={styles.codeLine}>EXPO_PUBLIC_OWNER_EMAIL_CELIA=celia@admin.com</Text>
        </View>
        <Text style={styles.infoSmall}>
          Depois, reinicie com cache limpo:{"\n"}<Text style={{ fontWeight: "700" }}>npx expo start -c</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Entrar</Text>

      <View style={styles.segment}>
        {OWNER_EMAILS.map((em) => {
          const active = email === em;
          const label = (() => {
            const lower = em.toLowerCase();
            if (lower.includes("denize")) return "Denize";
            if (lower.includes("célia") || lower.includes("celia")) return "Célia";
            return em;
          })();
          return (
            <TouchableOpacity
              key={em}
              onPress={() => setEmail(em)}
              style={[styles.segBtn, active && styles.segActive]}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput value={email} editable={false} style={styles.input} />

      <View style={styles.pwdRow}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry={!showPwd}
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
        />
        <TouchableOpacity onPress={() => setShowPwd((s) => !s)} style={styles.eyeBtn}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {showPwd ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>ENTRAR</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        Dica: após o primeiro login, a senha fica salva com segurança no aparelho.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  info: { color: colors.text, textAlign: "center", marginBottom: 10 },
  infoSmall: { color: colors.muted, textAlign: "center", marginTop: 8 },
  codeBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  codeLine: { color: colors.text, fontFamily: "monospace" as any },
  segment: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  segBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8F3EA",
  },
  segActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { color: colors.text, fontWeight: "600" },
  segTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  pwdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  eyeBtn: {
    height: 48,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    padding: 12,
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "800" },
  hint: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 10,
    fontSize: 12,
  },
});
