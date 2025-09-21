import React, { useCallback, useEffect } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMapEvents,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LatLngTuple } from "../../types";
import {
  calculateRouteLength,
  formatLength,
} from "../../helpers/routeCalculations";
import {
  getElevationData,
  simulateElevationData,
} from "../../helpers/elevationData";
import { calculateElevationStats } from "../../helpers/routeCalculations";
import LeafletDraw from "./LeafletDraw";
import styles from "./MapContainer.module.scss";

// Исправляем иконки маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapContainerProps {
  route: LatLngTuple[] | null;
  onRouteCreated: (
    route: LatLngTuple[],
    length: number,
    elevationData: number[],
    elevationStats: any
  ) => void;
  onRouteCleared: () => void;
  drawEnabled: boolean;
}

function ClickHandler() {
  useMapEvents({
    click(e) {
      console.log("Клик на карте:", e.latlng);
    },
  });
  return null;
}

// Компонент для обработки событий рисования
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

const MapContainer: React.FC<MapContainerProps> = ({
  route,
  onRouteCreated,
  onRouteCleared,
  drawEnabled,
}) => {
  const onCreated = useCallback(
    async (e: L.DrawEvents.Created) => {
      const { layerType, layer } = e;

      if (layerType === "polyline") {
        const polyline = layer as L.Polyline;
        const latLngs = polyline.getLatLngs();

        // Преобразуем LatLng объекты в кортежи [number, number]
        const coords: LatLngTuple[] = latLngs.map((latLng: any) => [
          latLng.lat,
          latLng.lng,
        ]) as LatLngTuple[];

        // Рассчитываем длину маршрута
        const length = calculateRouteLength(coords);

        // Получаем данные о высотах
        try {
          const elevations = await getElevationData(coords);
          const stats = calculateElevationStats(elevations);
          onRouteCreated(coords, length, elevations, stats);
          console.log("Данные о высотах:", stats);
          console.log("Отдельные высоты:", elevations.slice(0, 5)); // первые 5 высот
        } catch (error) {
          console.error("Ошибка получения высот:", error);
          // Устанавливаем заглушку даже при ошибке
          const simulatedElevations = simulateElevationData(coords);
          const stats = calculateElevationStats(simulatedElevations);
          onRouteCreated(coords, length, simulatedElevations, stats);
        }

        console.log("Нарисован маршрут:", coords);
        console.log(`Длина маршрута: ${formatLength(length)}`);
      }
    },
    [onRouteCreated]
  );

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
    <div className={styles.mapContainer}>
      <LeafletMapContainer
        center={[55.75, 37.62]}
        zoom={10}
        className={styles.map}
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
        <DrawEventHandler onCreated={onCreated} onDeleted={onRouteCleared} />

        <ClickHandler />
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;
