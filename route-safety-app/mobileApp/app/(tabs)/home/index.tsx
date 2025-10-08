import {
  View,
  Text,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, {
  Marker,
  Polyline,
  LatLng,
  MapPressEvent,
  UserLocationChangeEvent,
} from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import PlaceSearch, {
  PlaceResult,
  PlaceSearchHandle,
} from "../../../components/PlaceSearch";
import { styles } from "./styles";
import { Ionicons } from "@expo/vector-icons";
import { apiPost, API_CONFIG, getApiUrl } from "../../../config/api";
import { router } from "expo-router";
import { setAnalysisResult } from "../../../store/analysisStore";
import { getElevationData } from "./helpers";

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

async function fetchRoadRoute(points: LatLng[]): Promise<LatLng[] | null> {
  try {
    const coords = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const geom = data?.routes?.[0]?.geometry?.coordinates as
      | [number, number][]
      | undefined;
    if (!geom) return null;
    return geom.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  } catch {
    return null;
  }
}

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [routePolyline, setRoutePolyline] = useState<LatLng[] | null>(null);
  const [routeMode, setRouteMode] = useState(false);
  const [roadRouting, setRoadRouting] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [centeredToUser, setCenteredToUser] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tourismType, setTourismType] = useState("пеший");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const searchRef = useRef<PlaceSearchHandle>(null);
  const mapRef = useRef<MapView>(null);

  const tourismTypes = [
    "пеший",
    "велосипедный",
    "водный",
    "автомобильный",
    "воздушный",
    "мото",
  ];

  const loadingSteps = [
    "Получение данных о высотах...",
    "Анализ географического контекста...",
    "Расчет геометрии маршрута...",
    "Анализ ИИ в процессе...",
    "Формирование отчета...",
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Доступ к местоположению отклонен");
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current);
    })();
  }, []);

  const initialRegion = useMemo(
    () => ({
      latitude: location?.coords.latitude ?? 55.7558,
      longitude: location?.coords.longitude ?? 37.6176,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }),
    [location]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!roadRouting || waypoints.length < 2) {
        setRoutePolyline(null);
        return;
      }
      setRoutingLoading(true);
      const poly = await fetchRoadRoute(waypoints);
      if (!cancelled) {
        setRoutePolyline(poly);
        setRoutingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadRouting, waypoints]);

  const onSelectPlace = (p: PlaceResult) => {
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    const point = { latitude: lat, longitude: lon };
    setWaypoints((prev) => (routeMode ? [...prev, point] : [point]));
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
    searchRef.current?.blur();
    Keyboard.dismiss();
  };

  const dismissSearch = () => {
    searchRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { coordinate } = e.nativeEvent;
    setWaypoints((prev) => (routeMode ? [...prev, coordinate] : [coordinate]));
    dismissSearch();
  };

  const handleUserLocationChange = (e: UserLocationChangeEvent) => {
    const coord = e.nativeEvent.coordinate;
    if (!coord) return;
    if (!centeredToUser) {
      mapRef.current?.animateToRegion(
        {
          latitude: coord.latitude,
          longitude: coord.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
      setCenteredToUser(true);
    }
  };

  const totalKm = useMemo(() => {
    const pts = roadRouting && routePolyline ? routePolyline : waypoints;
    if (pts.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < pts.length; i++) sum += haversineKm(pts[i - 1], pts[i]);
    return sum;
  }, [waypoints, routePolyline, roadRouting]);

  const handleAnalyzePress = () => {
    if ((roadRouting && routePolyline?.length) || waypoints.length >= 2) {
      setAnalyzeOpen(true);
    }
  };

  const confirmAnalyze = async () => {
    try {
      setAnalyzeLoading(true);
      setLoadingStep(0);
      setLoadingProgress(0);

      const basePoints =
        roadRouting && routePolyline ? routePolyline : waypoints;
      const pts = basePoints.map((p) => ({
        lat: p.latitude,
        lng: p.longitude,
      }));
      const coords = pts.map((p) => [p.lat, p.lng] as [number, number]);
      const lengthKm = totalKm;

      // Step 1: Получение данных о высотах (2-3 сек)
      setLoadingStep(0);
      setLoadingProgress(10);
      const elevations = await getElevationData(basePoints);
      let gain = 0;
      for (let i = 1; i < elevations.length; i++) {
        const delta = elevations[i] - elevations[i - 1];
        if (delta > 0) gain += delta;
      }

      // Step 2: Анализ географического контекста (1-2 сек)
      setLoadingStep(1);
      setLoadingProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 3: Расчет геометрии маршрута (0.5 сек)
      setLoadingStep(2);
      setLoadingProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Анализ ИИ (3-6 сек)
      setLoadingStep(3);
      setLoadingProgress(70);

      const body = {
        coordinates: coords,
        lengthKm,
        lengthMeters: Math.round(lengthKm * 1000),
        elevationGain: Math.round(gain),
        tourismType,
        startDate,
        endDate,
        elevationData: elevations,
      };
      const url = getApiUrl(API_CONFIG.ENDPOINTS.ANALYZE_ROUTE);
      console.error("[ANALYZE] POST", url, "payload points:", pts.length, body);
      const result = await apiPost<any>(
        API_CONFIG.ENDPOINTS.ANALYZE_ROUTE,
        body
      );

      // Step 5: Формирование отчета (0.5 сек)
      setLoadingStep(4);
      setLoadingProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("[ANALYZE] OK", typeof result);
      setAnalysisResult(result);
      setAnalysisDone(true);
      setLoadingProgress(100);
      setAnalyzeLoading(false);
    } catch (e: any) {
      console.error("[ANALYZE] FAIL", e?.message || e);
      setAnalyzeLoading(false);
      setLoadingStep(0);
      setLoadingProgress(0);
      Alert.alert(
        "Ошибка",
        "Не удалось запустить анализ. Проверьте доступность бэкенда."
      );
    }
  };

  const goToResults = () => {
    setAnalyzeOpen(false);
    router.push("/(tabs)/explore");
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    console.log("[DATE] Start date picker event:", event.type, selectedDate);

    // Закрываем picker на Android после выбора
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
    }

    // Обновляем дату если она была выбрана
    if (selectedDate) {
      setStartDateObj(selectedDate);
      setStartDate(selectedDate.toISOString().slice(0, 10));
      console.log(
        "[DATE] Start date updated to:",
        selectedDate.toISOString().slice(0, 10)
      );
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    console.log("[DATE] End date picker event:", event.type, selectedDate);

    // Закрываем picker на Android после выбора
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
    }

    // Обновляем дату если она была выбрана
    if (selectedDate) {
      setEndDateObj(selectedDate);
      setEndDate(selectedDate.toISOString().slice(0, 10));
      console.log(
        "[DATE] End date updated to:",
        selectedDate.toISOString().slice(0, 10)
      );
    }
  };

  const [elevation, setElevation] = useState<number[]>([]);

  const elevationSummary = useMemo(() => {
    if (!elevation || elevation.length === 0) return null;
    const min = Math.min(...elevation);
    const max = Math.max(...elevation);
    let gain = 0;
    for (let i = 1; i < elevation.length; i++) {
      const delta = elevation[i] - elevation[i - 1];
      if (delta > 0) gain += delta;
    }
    return { min, max, gain: Math.round(gain), count: elevation.length };
  }, [elevation]);

  const info = useMemo(() => {
    const pts = roadRouting && routePolyline ? routePolyline : waypoints;
    if (pts.length < 2) return null;
    let minLat = Infinity,
      minLon = Infinity,
      maxLat = -Infinity,
      maxLon = -Infinity;
    pts.forEach((p) => {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLon) minLon = p.longitude;
      if (p.longitude > maxLon) maxLon = p.longitude;
    });
    return {
      points: pts,
      bbox: { minLat, minLon, maxLat, maxLon },
      lengthKm: totalKm,
    };
  }, [roadRouting, routePolyline, waypoints, totalKm]);

  const handleGetElevation = async (points: LatLng[]) => {
    const data = await getElevationData(points);
    console.log(data);

    setElevation(data);
  };

  useEffect(() => {
    if (info?.points?.length || (0 > 0 && info?.points)) {
      console.log("get");
      handleGetElevation(info?.points);
    }
  }, [info?.points.length]);

  return (
    <View style={styles.container}>
      <PlaceSearch
        ref={searchRef}
        visible={searchVisible}
        onSelect={onSelectPlace}
      />

      {!searchVisible && (
        <TouchableOpacity
          onPress={() => setSearchVisible(true)}
          activeOpacity={0.9}
          style={styles.searchToggleButton}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.routeControlsContainer}>
        <TouchableOpacity
          onPress={() => setRouteMode((v) => !v)}
          activeOpacity={0.9}
          style={[
            styles.routeModeButton,
            routeMode && styles.routeModeButtonActive,
          ]}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRoadRouting((v) => !v)}
          activeOpacity={0.9}
          style={[
            styles.roadRoutingButton,
            roadRouting && styles.roadRoutingButtonActive,
          ]}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          onUserLocationChange={handleUserLocationChange}
          onPress={handleMapPress}
          onPanDrag={dismissSearch}
        >
          {waypoints.map((pt, idx) => (
            <Marker
              key={`${pt.latitude}-${pt.longitude}-${idx}`}
              coordinate={pt}
              title={`Точка ${idx + 1}`}
            />
          ))}
          {!roadRouting && waypoints.length >= 2 && (
            <Polyline
              coordinates={waypoints}
              strokeColor="#007AFF"
              strokeWidth={4}
              tappable
              onPress={handleAnalyzePress}
            />
          )}
          {roadRouting && routePolyline && (
            <Polyline
              coordinates={routePolyline}
              strokeColor="#34C759"
              strokeWidth={5}
              tappable
              onPress={handleAnalyzePress}
            />
          )}
        </MapView>
      )}

      {routingLoading && roadRouting && (
        <View style={styles.routingIndicatorContainer}>
          <ActivityIndicator color="#34C759" />
        </View>
      )}

      {info && info.points.length >= 2 && (
        <TouchableOpacity
          onPress={() => setInfoOpen(true)}
          activeOpacity={0.9}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {searchVisible && (
        <TouchableOpacity
          onPress={() => setSearchVisible(false)}
          activeOpacity={0.9}
          style={styles.searchToggleButton}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={analyzeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAnalyzeOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAnalyzeOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Анализ маршрута</Text>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Основная информация */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Информация о маршруте</Text>
                <Text style={{ color: "#666", marginBottom: 8 }}>
                  Точек:{" "}
                  {roadRouting && routePolyline
                    ? routePolyline.length
                    : waypoints.length}{" "}
                  • Длина: {totalKm.toFixed(2)} км
                </Text>
              </View>

              {/* Тип туризма */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Тип туризма</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ paddingHorizontal: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        paddingVertical: 8,
                      }}
                    >
                      {tourismTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setTourismType(type)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor:
                              tourismType === type ? "#007AFF" : "#f0f0f0",
                          }}
                        >
                          <Text
                            style={{
                              color: tourismType === type ? "#fff" : "#333",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Даты */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Даты похода</Text>

                <View style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                    >
                      Начало
                    </Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        console.log(
                          "[DATE] Opening start date picker, current date:",
                          startDate
                        );
                        setShowStartDatePicker(true);
                      }}
                    >
                      <Text style={{ fontSize: 16, color: "#333" }}>
                        {startDate}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, color: "#666", marginBottom: 4 }}
                    >
                      Конец
                    </Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => {
                        console.log(
                          "[DATE] Opening end date picker, current date:",
                          endDate
                        );
                        setShowEndDatePicker(true);
                      }}
                    >
                      <Text style={{ fontSize: 16, color: "#333" }}>
                        {endDate}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                  Нажмите для выбора даты
                </Text>
              </View>

              {/* Высоты */}
              {elevationSummary && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Данные о высотах</Text>
                  <View style={styles.elevationSummary}>
                    <Text style={styles.elevationText}>
                      Точек: {elevationSummary.count}
                    </Text>
                    <Text style={styles.elevationText}>
                      Мин: {elevationSummary.min} м
                    </Text>
                    <Text style={styles.elevationText}>
                      Макс: {elevationSummary.max} м
                    </Text>
                    <Text style={styles.elevationText}>
                      Набор высоты: {elevationSummary.gain} м
                    </Text>
                  </View>
                </View>
              )}

              {/* Progress bar during loading */}
              {analyzeLoading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${loadingProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {loadingProgress}% • {loadingSteps[loadingStep]}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {!analysisDone ? (
                <>
                  <TouchableOpacity
                    onPress={() => setAnalyzeOpen(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={analyzeLoading}
                    onPress={confirmAnalyze}
                    style={[
                      styles.analyzePrimaryButton,
                      analyzeLoading && styles.analyzePrimaryButtonDisabled,
                    ]}
                  >
                    {analyzeLoading ? (
                      <>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.analyzePrimaryText}>
                          {loadingSteps[loadingStep]}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.analyzePrimaryText}>
                        Проанализировать
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setAnalyzeOpen(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Закрыть</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToResults}
                    style={styles.analyzePrimaryButton}
                  >
                    <Text style={styles.analyzePrimaryText}>
                      Смотреть результаты
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={infoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setInfoOpen(false)}
        >
          <Pressable
            style={styles.infoModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.infoModalTitle}>Информация о маршруте</Text>
            {info && (
              <>
                <ScrollView
                  style={{ maxHeight: 400 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Основная информация */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>
                      📏 Основные параметры
                    </Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Длина маршрута:</Text>
                      <Text style={styles.infoValue}>
                        {info.lengthKm.toFixed(2)} км
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Количество точек:</Text>
                      <Text style={styles.infoValue}>{info.points.length}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Тип маршрута:</Text>
                      <Text style={styles.infoValue}>
                        {roadRouting ? "По дорогам" : "Прямая линия"}
                      </Text>
                    </View>
                  </View>

                  {/* Географические границы */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>
                      🗺️ Географические границы
                    </Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Северная граница:</Text>
                      <Text style={styles.infoValue}>
                        {info.bbox.maxLat.toFixed(4)}°
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Южная граница:</Text>
                      <Text style={styles.infoValue}>
                        {info.bbox.minLat.toFixed(4)}°
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Западная граница:</Text>
                      <Text style={styles.infoValue}>
                        {info.bbox.minLon.toFixed(4)}°
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Восточная граница:</Text>
                      <Text style={styles.infoValue}>
                        {info.bbox.maxLon.toFixed(4)}°
                      </Text>
                    </View>
                  </View>

                  {/* Координаты (скрытые по умолчанию) */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>
                      📍 Координаты точек
                    </Text>
                    <TouchableOpacity
                      style={styles.coordinatesToggle}
                      onPress={() => setShowCoordinates(!showCoordinates)}
                    >
                      <Text style={styles.coordinatesToggleText}>
                        {showCoordinates
                          ? "Скрыть координаты"
                          : "Показать координаты"}
                      </Text>
                      <Ionicons
                        name={showCoordinates ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#007AFF"
                      />
                    </TouchableOpacity>
                    {showCoordinates && (
                      <View style={styles.coordinatesList}>
                        {info.points.map((p, i) => (
                          <Text
                            key={`${p.latitude}-${p.longitude}-${i}`}
                            style={styles.coordinateItem}
                          >
                            {i + 1}. {p.latitude.toFixed(6)},{" "}
                            {p.longitude.toFixed(6)}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      marginTop: 16,
                      color: "#666",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    Регионы, высоты и детальный анализ будут получены при
                    запуске ИИ-анализа
                  </Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setInfoOpen(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Закрыть</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setInfoOpen(false);
                      setAnalyzeOpen(true);
                    }}
                    style={styles.analyzePrimaryButton}
                  >
                    <Text style={styles.analyzePrimaryText}>Анализ ИИ</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Pickers - Поверх основного модала */}
      {showStartDatePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showStartDatePicker}
          onRequestClose={() => setShowStartDatePicker(false)}
          statusBarTranslucent
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                margin: 20,
                minWidth: 320,
                maxWidth: "90%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  marginBottom: 20,
                  textAlign: "center",
                  color: "#333",
                }}
              >
                Выберите дату начала
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Платформа: {Platform.OS} | Текущая дата: {startDate}
              </Text>

              <View
                style={{
                  alignItems: "center",
                  marginBottom: 20,
                  minHeight: 100,
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <DateTimePicker
                  value={startDateObj}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleStartDateChange}
                  minimumDate={new Date()}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {Platform.OS === "android"
                    ? "Выберите дату выше и нажмите 'Готово'"
                    : "Поворачивайте колесики для выбора даты"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log("[DATE] Start date picker cancelled");
                    setShowStartDatePicker(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e1e5e9",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#666", fontSize: 16, fontWeight: "500" }}
                  >
                    Отмена
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log(
                      "[DATE] Start date picker confirmed, date:",
                      startDateObj
                    );
                    setStartDate(startDateObj.toISOString().slice(0, 10));
                    setShowStartDatePicker(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: "#007AFF",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                  >
                    Готово
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showEndDatePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showEndDatePicker}
          onRequestClose={() => setShowEndDatePicker(false)}
          statusBarTranslucent
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.8)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                margin: 20,
                minWidth: 320,
                maxWidth: "90%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  marginBottom: 20,
                  textAlign: "center",
                  color: "#333",
                }}
              >
                Выберите дату окончания
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Платформа: {Platform.OS} | Текущая дата: {endDate}
              </Text>

              <View
                style={{
                  alignItems: "center",
                  marginBottom: 20,
                  minHeight: 100,
                  justifyContent: "center",
                  backgroundColor: "#f8f9fa",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <DateTimePicker
                  value={endDateObj}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleEndDateChange}
                  minimumDate={startDateObj}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {Platform.OS === "android"
                    ? "Выберите дату выше и нажмите 'Готово'"
                    : "Поворачивайте колесики для выбора даты"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log("[DATE] End date picker cancelled");
                    setShowEndDatePicker(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e1e5e9",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#666", fontSize: 16, fontWeight: "500" }}
                  >
                    Отмена
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log(
                      "[DATE] End date picker confirmed, date:",
                      endDateObj
                    );
                    setEndDate(endDateObj.toISOString().slice(0, 10));
                    setShowEndDatePicker(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: "#007AFF",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                  >
                    Готово
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
