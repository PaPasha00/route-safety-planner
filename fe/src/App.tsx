import React, { useState, useCallback } from "react";
import { LatLngTuple, ElevationStats } from "./types";
import MapContainer from "./components/Map/MapContainer";
import RouteAnalyzer from "./components/RouteAnalyzer/RouteAnalyzer";
import RouteInfo from "./components/RouteInfo/RouteInfo";
import { formatLength } from "./helpers/routeCalculations";
import styles from "./App.module.scss";

function App() {
  const [route, setRoute] = useState<LatLngTuple[] | null>(null);
  const [drawEnabled, setDrawEnabled] = useState(true);
  const [routeLength, setRouteLength] = useState<number>(0);
  const [elevationData, setElevationData] = useState<number[] | null>(null);
  const [elevationStats, setElevationStats] = useState<ElevationStats | null>(
    null
  );
  const [loadingElevation, setLoadingElevation] = useState(false);

  const handleRouteCreated = useCallback(
    (
      coords: LatLngTuple[],
      length: number,
      elevations: number[],
      stats: ElevationStats
    ) => {
      setRoute(coords);
      setRouteLength(length);
      setElevationData(elevations);
      setElevationStats(stats);
      setDrawEnabled(false);
    },
    []
  );

  const handleRouteCleared = useCallback(() => {
    setRoute(null);
    setRouteLength(0);
    setElevationData(null);
    setElevationStats(null);
    setDrawEnabled(true);
  }, []);

  return (
    <div className={styles.app}>
      <RouteAnalyzer
        route={route}
        length={Number(formatLength(routeLength).replace(" км", ""))}
        elevationGain={elevationStats?.totalGain || 0}
        elevationData={elevationData}
      />

      <MapContainer
        route={route}
        onRouteCreated={handleRouteCreated}
        onRouteCleared={handleRouteCleared}
        drawEnabled={drawEnabled}
      />

      {route && (
        <RouteInfo
          route={route}
          routeLength={routeLength}
          elevationStats={elevationStats}
          loadingElevation={loadingElevation}
          onClear={handleRouteCleared}
        />
      )}
    </div>
  );
}

export default App;
