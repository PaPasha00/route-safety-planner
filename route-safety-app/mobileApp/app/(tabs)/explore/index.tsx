import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { getAnalysisResult } from "../../../store/analysisStore";
import { styles } from "./styles";

export default function ExploreScreen() {
  const data = getAnalysisResult();

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>
          Нет данных анализа. Постройте маршрут и запустите анализ ИИ.
        </Text>
      </View>
    );
  }

  const structured = data.analysisStructured;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Если пришёл структурированный JSON — показываем его */}
          {structured ? (
            <>
              {/* Резюме */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🧠 Резюме</Text>
                <Text style={styles.cardText}>
                  Сложность: {structured.summary?.difficultyScore ?? "—"}/10
                </Text>
                {structured.summary?.difficultyReasoning && (
                  <Text style={styles.cardText}>
                    {structured.summary.difficultyReasoning}
                  </Text>
                )}
              </View>

              {/* Статистика */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📈 Статистика</Text>
                <View style={styles.statsGrid}>
                  {typeof structured.stats?.distanceKm === "number" && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {structured.stats.distanceKm}км
                      </Text>
                      <Text style={styles.statLabel}>Дистанция</Text>
                    </View>
                  )}
                  {typeof structured.stats?.elevationGainM === "number" && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {structured.stats.elevationGainM}м
                      </Text>
                      <Text style={styles.statLabel}>Набор</Text>
                    </View>
                  )}
                  {typeof structured.stats?.avgSlopePercent === "number" && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {structured.stats.avgSlopePercent.toFixed(1)}%
                      </Text>
                      <Text style={styles.statLabel}>Средний уклон</Text>
                    </View>
                  )}
                  {typeof structured.stats?.maxSlopePercent === "number" && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {structured.stats.maxSlopePercent.toFixed(1)}%
                      </Text>
                      <Text style={styles.statLabel}>Макс. уклон</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* География */}
              {(structured.geography ||
                data.terrainType ||
                data.formattedGeoContext) && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🗺️ География</Text>
                  {structured.geography?.terrainType && (
                    <View style={styles.chipContainer}>
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>
                          {structured.geography.terrainType}
                        </Text>
                      </View>
                    </View>
                  )}
                  {Array.isArray(structured.geography?.regions) &&
                    structured.geography.regions.length > 0 && (
                      <Text style={styles.cardText}>
                        Регионы: {structured.geography.regions.join(", ")}
                      </Text>
                    )}
                  {data.formattedGeoContext && (
                    <Text style={styles.cardText}>
                      {data.formattedGeoContext}
                    </Text>
                  )}
                  {structured.geography?.notes && (
                    <Text style={styles.cardText}>
                      {structured.geography.notes}
                    </Text>
                  )}
                </View>
              )}

              {/* По дням */}
              {Array.isArray(structured.days) && structured.days.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🛣️ По дням</Text>
                  {structured.days.map((d: any, i: number) => (
                    <View key={i} style={styles.dayContainer}>
                      <Text style={styles.dayTitle}>
                        День {d.day ?? i + 1} {d.date ? `(${d.date})` : ""}
                      </Text>
                      <View style={styles.dayStats}>
                        {typeof d.distanceKm === "number" && (
                          <Text style={styles.dayStat}>
                            📏 {d.distanceKm} км
                          </Text>
                        )}
                        {typeof d.elevationGainM === "number" && (
                          <Text style={styles.dayStat}>
                            ⬆️ {d.elevationGainM} м
                          </Text>
                        )}
                      </View>
                      {d.weather && (
                        <Text style={styles.cardText}>
                          Погода: {d.weather.temperatureMin}°–
                          {d.weather.temperatureMax}°, {d.weather.conditions},
                          ветер {d.weather.windSpeed} м/с, осадки{" "}
                          {d.weather.precipitation} мм
                        </Text>
                      )}
                      {Array.isArray(d.keyPoints) && d.keyPoints.length > 0 && (
                        <Text style={styles.cardText}>
                          Ключевые точки: {d.keyPoints.join(", ")}
                        </Text>
                      )}
                      {d.description && (
                        <Text style={styles.dayDescription}>
                          {d.description}
                        </Text>
                      )}
                      {Array.isArray(d.recommendations) &&
                        d.recommendations.length > 0 && (
                          <Text style={styles.cardText}>
                            Рекомендации: {d.recommendations.join(", ")}
                          </Text>
                        )}
                    </View>
                  ))}
                </View>
              )}

              {/* Рекомендации и предупреждения */}
              {Array.isArray(structured.recommendations) &&
                structured.recommendations.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>🎯 Рекомендации</Text>
                    {structured.recommendations.map((r: string, i: number) => (
                      <Text key={i} style={styles.recommendationItem}>
                        • {r}
                      </Text>
                    ))}
                  </View>
                )}

              {Array.isArray(structured.warnings) &&
                structured.warnings.length > 0 && (
                  <View style={[styles.card, styles.warningCard]}>
                    <Text style={styles.warningTitle}>⚠️ Важно знать</Text>
                    {structured.warnings.map((w: string, i: number) => (
                      <Text key={i} style={styles.warningText}>
                        • {w}
                      </Text>
                    ))}
                  </View>
                )}
            </>
          ) : (
            // Фоллбэк: просто текст анализа, если JSON не распарсился
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🧠 Резюме ИИ</Text>
              <Text style={styles.cardText}>{data.analysis}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
