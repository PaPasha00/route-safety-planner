import { View, Text, ScrollView, StyleSheet } from "react-native";
import { getAnalysisResult } from "../../../store/analysisStore";

export default function ExploreScreen() {
  const data = getAnalysisResult();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Исследовать</Text>
      {!data ? (
        <Text style={styles.note}>
          Нет данных анализа. Постройте маршрут и запустите анализ ИИ.
        </Text>
      ) : (
        <ScrollView style={styles.scroll}>
          <Text style={styles.section}>Результаты анализа</Text>
          <Text selectable>{JSON.stringify(data, null, 2)}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  note: { color: "#666" },
  section: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  scroll: { flex: 1 },
});
