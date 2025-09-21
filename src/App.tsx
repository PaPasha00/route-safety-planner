import React, { useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import RouteAnalyzer from "./components/RouteAnalyze";
import LeafletDraw from "./components/DrawControl";
import {
  calculateElevationStats,
  getElevationData,
  simulateElevationData,
} from "./heplers/height";

// Исправляем иконки маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLngTuple = [number, number];

function ClickHandler() {
  useMapEvents({
    click(e) {
      console.log("Клик на карте:", e.latlng);
    },
  });
  return null;
}

// Новый компонент для обработки событий рисования
function DrawEventHandler({
  onCreated,
  onDeleted,
}: {
  onCreated: (e: L.DrawEvents.Created) => void;
  onDeleted: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleCreated = (e: L.DrawEvents.Created) => {
      onCreated(e);
    };

    const handleDeleted = () => {
      onDeleted();
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);
    };
  }, [map, onCreated, onDeleted]);

  return null;
}

// Функция для расчета длины маршрута в метрах
const calculateRouteLength = (route: LatLngTuple[]): number => {
  if (route.length < 2) return 0;

  let totalLength = 0;
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    totalLength += L.latLng(prev[0], prev[1]).distanceTo(
      L.latLng(curr[0], curr[1])
    );
  }
  return totalLength;
};

// Функция для форматирования длины
const formatLength = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(0)} м`;
  } else {
    return `${(meters / 1000).toFixed(2)} км`;
  }
};

function App() {
  const [route, setRoute] = useState<LatLngTuple[] | null>(null);
  const [drawEnabled, setDrawEnabled] = useState(true);
  const [routeLength, setRouteLength] = useState<number>(0);
  const [elevationData, setElevationData] = useState<number[] | null>(null);
  const [elevationStats, setElevationStats] = useState<{
    totalGain: number;
    totalLoss: number;
    minElevation: number;
    maxElevation: number;
    avgElevation: number;
  } | null>(null);
  const [loadingElevation, setLoadingElevation] = useState(false);

  const onCreated = useCallback(async (e: L.DrawEvents.Created) => {
    const { layerType, layer } = e;

    if (layerType === "polyline") {
      const polyline = layer as L.Polyline;
      const latLngs = polyline.getLatLngs();

      // Преобразуем LatLng объекты в кортежи [number, number]
      const coords: LatLngTuple[] = latLngs.map((latLng: any) => [
        latLng.lat,
        latLng.lng,
      ]) as LatLngTuple[];

      setRoute(coords);
      setDrawEnabled(false);

      // Рассчитываем длину маршрута
      const length = calculateRouteLength(coords);
      setRouteLength(length);

      // Получаем данные о высотах
      setLoadingElevation(true);
      try {
        const elevations = await getElevationData(coords);
        setElevationData(elevations);

        const stats = calculateElevationStats(elevations);
        setElevationStats(stats);

        console.log("Данные о высотах:", stats);
        console.log("Отдельные высоты:", elevations.slice(0, 5)); // первые 5 высот
      } catch (error) {
        console.error("Ошибка получения высот:", error);
        // Устанавливаем заглушку даже при ошибке
        const simulatedElevations = simulateElevationData(coords);
        setElevationData(simulatedElevations);
        setElevationStats(calculateElevationStats(simulatedElevations));
      } finally {
        setLoadingElevation(false);
      }

      console.log("Нарисован маршрут:", coords);
      console.log(`Длина маршрута: ${formatLength(length)}`);
    }
  }, []);

  const handleClear = () => {
    setRoute(null);
    setRouteLength(0);
    setElevationData(null);
    setElevationStats(null);
    setDrawEnabled(true);
  };

  const drawOptions: L.Control.DrawOptions = {
    position: "topright",
    draw: {
      polyline: {
        shapeOptions: {
          color: "#3388ff",
          weight: 4,
        },
        metric: true,
        showLength: true,
      },
      polygon: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: new L.FeatureGroup(),
      remove: true,
    },
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <RouteAnalyzer
        route={route}
        length={Number(formatLength(routeLength).replace(" км", ""))}
        elevationGain={elevationStats?.totalGain || 0}
        elevationData={elevationData}
      />
      <MapContainer
        center={[55.75, 37.62]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <TileLayer
          url="http://localhost:3001/tiles/h/{z}/{x}/{y}"
          attribution="© nakarte.me (через прокси)"
          maxZoom={14}
        />

        {/* Отображаем маршрут */}
        {route && <Polyline positions={route} color="#3388ff" weight={4} />}

        {/* Компонент рисования */}
        {drawEnabled && <LeafletDraw {...drawOptions} />}

        {/* Обработчик событий рисования */}
        <DrawEventHandler onCreated={onCreated} onDeleted={handleClear} />

        <ClickHandler />
      </MapContainer>

      {route && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxWidth: "400px",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          <h4>📈 Маршрут нарисован</h4>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ margin: "5px 0" }}>
              <strong>Точек:</strong> {route.length}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>Длина:</strong> {formatLength(routeLength)}
            </p>

            {loadingElevation && (
              <p style={{ margin: "5px 0", color: "#666" }}>
                ⏳ Загрузка данных о высотах...
              </p>
            )}

            {elevationStats && (
              <>
                <p style={{ margin: "5px 0" }}>
                  <strong>Набор высоты:</strong> {elevationStats.totalGain} м
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Спуск:</strong> {elevationStats.totalLoss} м
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Мин. высота:</strong> {elevationStats.minElevation} м
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Макс. высота:</strong> {elevationStats.maxElevation} м
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Ср. высота:</strong> {elevationStats.avgElevation} м
                </p>
              </>
            )}
          </div>

          <p style={{ margin: "10px 0 5px 0" }}>
            <strong>Координаты:</strong>
          </p>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              marginBottom: "15px",
              padding: "5px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            {route.map((coord, index) => (
              <div
                key={index}
                style={{
                  fontSize: "11px",
                  marginBottom: "3px",
                  fontFamily: "monospace",
                }}
              >
                {index + 1}. {coord[0].toFixed(6)}, {coord[1].toFixed(6)}
              </div>
            ))}
          </div>

          <button
            onClick={handleClear}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Очистить маршрут
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
