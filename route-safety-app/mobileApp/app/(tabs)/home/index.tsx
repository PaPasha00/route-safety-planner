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
} from "react-native";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const searchRef = useRef<PlaceSearchHandle>(null);
  const mapRef = useRef<MapView>(null);

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
      const pts = (
        roadRouting && routePolyline ? routePolyline : waypoints
      ).map((p) => ({ lat: p.latitude, lng: p.longitude }));
      const body = {
        points: pts,
        tourismType: "пеший",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      };
      const url = getApiUrl(API_CONFIG.ENDPOINTS.ANALYZE_ROUTE);
      console.error("[ANALYZE] POST", url, "payload points:", pts.length);
      const result = await apiPost<any>(
        API_CONFIG.ENDPOINTS.ANALYZE_ROUTE,
        body
      );
      console.log("[ANALYZE] OK", typeof result);
      setAnalysisResult(result);
      setAnalysisDone(true);
      setAnalyzeLoading(false);
    } catch (e: any) {
      console.error("[ANALYZE] FAIL", e?.message || e);
      setAnalyzeLoading(false);
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
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
              Анализ маршрута
            </Text>
            <Text style={{ marginBottom: 4 }}>
              Точек:{" "}
              {roadRouting && routePolyline
                ? routePolyline.length
                : waypoints.length}
            </Text>
            <Text style={{ marginBottom: 4 }}>
              Длина: {totalKm.toFixed(2)} км
            </Text>
            <Text style={{ marginBottom: 12, color: "#666" }}>
              Включить высоты/районы в отчёт (будут определены бэкендом)
            </Text>
            <View style={styles.modalFooter}>
              {!analysisDone ? (
                <>
                  <TouchableOpacity onPress={() => setAnalyzeOpen(false)}>
                    <Text style={{ color: "#888", fontSize: 16 }}>Отмена</Text>
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
                        <Text style={styles.analyzePrimaryText}>Анализ...</Text>
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
                  <TouchableOpacity onPress={() => setAnalyzeOpen(false)}>
                    <Text style={{ color: "#888", fontSize: 16 }}>Закрыть</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToResults}
                    style={styles.analyzePrimaryButton}
                  >
                    <Text style={styles.analyzePrimaryText}>
                      Смотреть результаты анализа
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
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
              Информация о маршруте
            </Text>
            {info && (
              <>
                <ScrollView style={{ maxHeight: 360 }}>
                  <Text style={{ marginBottom: 4 }}>
                    Длина: {info.lengthKm.toFixed(2)} км
                  </Text>
                  <Text style={{ marginBottom: 6 }}>
                    BBox: [ {info.bbox.minLat.toFixed(4)},{" "}
                    {info.bbox.minLon.toFixed(4)} ] — [{" "}
                    {info.bbox.maxLat.toFixed(4)}, {info.bbox.maxLon.toFixed(4)}{" "}
                    ]
                  </Text>
                  <Text style={{ fontWeight: "600", marginBottom: 6 }}>
                    Точки (lat, lon):
                  </Text>
                  {info.points.map((p, i) => (
                    <Text
                      key={`${p.latitude}-${p.longitude}-${i}`}
                      style={{ color: "#333" }}
                    >
                      {i + 1}. {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
                    </Text>
                  ))}
                  <Text style={{ marginTop: 10, color: "#666" }}>
                    Регионы/районы, высоты будут подтянуты при анализе ИИ
                  </Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity onPress={() => setInfoOpen(false)}>
                    <Text style={{ color: "#888", fontSize: 16 }}>Закрыть</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToResults}
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
    </View>
  );
}
