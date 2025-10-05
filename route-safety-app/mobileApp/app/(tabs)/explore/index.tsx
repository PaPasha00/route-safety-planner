import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { getAnalysisResult } from "../../../store/analysisStore";
import { styles } from "./styles";

export default function ExploreScreen() {
  const data = getAnalysisResult();

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Исследовать</Text>
        <Text style={styles.note}>
          Нет данных анализа. Постройте маршрут и запустите анализ ИИ.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Анализ маршрута</Text>

          {/* Общая информация */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Общая оценка</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>Сложность: </Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingValue}>
                  {data.analysis.match(/Оценка: (\d\/\d)/)?.[1] || "6/10"}
                </Text>
              </View>
            </View>
            <Text style={styles.cardText}>
              {data.analysis
                .split("Обоснование:")[1]
                ?.split("---")[0]
                ?.trim() ||
                "Короткая дистанция с значительным перепадом высот."}
            </Text>
          </View>

          {/* Статистика */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Статистика маршрута</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {data.stats?.maxElevation - data.stats?.minElevation || 409}м
                </Text>
                <Text style={styles.statLabel}>Перепад высот</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {data.dailyRoutes?.[0]?.distance || 0.67}км
                </Text>
                <Text style={styles.statLabel}>Дистанция</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {data.stats?.avgSlope?.toFixed(1) || 14.7}%
                </Text>
                <Text style={styles.statLabel}>Средний уклон</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.totalDays || 1}</Text>
                <Text style={styles.statLabel}>Дней</Text>
              </View>
            </View>
          </View>

          {/* Географическая информация */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🗺️ География</Text>
            <Text style={styles.cardText}>{data.formattedGeoContext}</Text>
            <View style={styles.chipContainer}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{data.terrainType}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Умеренно-континентальный климат
                </Text>
              </View>
            </View>
          </View>

          {/* Погода */}
          {data.dailyRoutes?.[0]?.weather && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌤️ Погода</Text>
              <View style={styles.weatherContainer}>
                <View style={styles.weatherMain}>
                  <Text style={styles.weatherTemp}>
                    {data.dailyRoutes[0].weather.temperature.min}° -{" "}
                    {data.dailyRoutes[0].weather.temperature.max}°
                  </Text>
                  <Text style={styles.weatherConditions}>
                    {data.dailyRoutes[0].weather.conditions}
                  </Text>
                </View>
                <View style={styles.weatherDetails}>
                  <Text style={styles.weatherDetail}>
                    💨 Ветер: {data.dailyRoutes[0].weather.windSpeed} м/с
                  </Text>
                  <Text style={styles.weatherDetail}>
                    💧 Осадки: {data.dailyRoutes[0].weather.precipitation} мм
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Рекомендации */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Рекомендации</Text>
            <View style={styles.recommendationsList}>
              <Text style={styles.recommendationItem}>
                • Треккинговые ботинки
              </Text>
              <Text style={styles.recommendationItem}>
                • Ветрозащитная куртка
              </Text>
              <Text style={styles.recommendationItem}>• Вода 0,5-1 л</Text>
              <Text style={styles.recommendationItem}>
                • Проверить погоду перед выходом
              </Text>
            </View>
          </View>

          {/* Детали маршрута */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛣️ Детали маршрута</Text>
            {data.dailyRoutes?.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayTitle}>
                  День {day.day} ({day.date})
                </Text>
                <View style={styles.dayStats}>
                  <Text style={styles.dayStat}>📏 {day.distance} км</Text>
                  <Text style={styles.dayStat}>
                    ⬆️{" "}
                    {data.stats?.maxElevation - data.stats?.minElevation || 409}{" "}
                    м набора
                  </Text>
                </View>
                <Text style={styles.dayDescription}>{day.description}</Text>
              </View>
            ))}
          </View>

          {/* Технические особенности */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Технические особенности</Text>
            <Text style={styles.cardText}>
              Маршрут полностью пролегает в городском округе Химки. Пересеченная
              местность с умеренно крутыми подъемами. Навигационная сложность
              низкая.
            </Text>
          </View>

          {/* Предупреждения */}
          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.warningTitle}>⚠️ Важно знать</Text>
            <Text style={styles.warningText}>
              • Крутой подъем до {data.stats?.maxSlope?.toFixed(1) || 14.7}%
              {"\n"}• Осенью возможны грязь и мокрая листва
              {"\n"}• Требуется средний уровень физической подготовки
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
