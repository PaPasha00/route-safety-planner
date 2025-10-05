import React, { useState, useEffect } from "react";
import {
  LatLngTuple,
  ElevationStats,
  RouteAnalysisRequest,
  RouteAnalysisResponse,
  DailyRoute,
} from "../../types";
import { analyzeRoute } from "../../helpers/api";
import { useDraggable } from "../../hooks/useDraggable";
import { useResizable } from "../../hooks/useResizable";
import styles from "./RouteAnalyzer.module.scss";

interface RouteAnalyzerProps {
  route: LatLngTuple[] | null;
  length: number;
  elevationGain: number;
  elevationData: number[] | null;
}

const RouteAnalyzer: React.FC<RouteAnalyzerProps> = ({
  route,
  length,
  elevationGain,
  elevationData,
}) => {
  const [inputs, setInputs] = useState({
    tourismType: "пеший",
    startDate: "",
    endDate: "",
  });
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [dailyRoutes, setDailyRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const draggable = useDraggable();
  const resizable = useResizable({
    minWidth: 400,
    minHeight: 300,
    maxWidth: 800,
    maxHeight: 600,
  });

  useEffect(() => {
    // Устанавливаем даты по умолчанию
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setInputs((prev) => ({
      ...prev,
      startDate: today.toISOString().split("T")[0],
      endDate: tomorrow.toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    // Активируем перетаскивание
    draggable.enableDragging();
    resizable.enableResizing();

    return () => {
      draggable.disableDragging();
      resizable.disableResizing();
    };
  }, [draggable, resizable]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    console.log("Input changed:", e.target.name, e.target.value);
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route) return;

    setLoading(true);
    setAnalysis("");
    setResult("");

    try {
      const requestData: RouteAnalysisRequest = {
        lengthKm: length,
        elevationGain: elevationGain,
        tourismType: inputs.tourismType,
        startDate: inputs.startDate,
        endDate: inputs.endDate,
        coordinates: route,
        elevationData: elevationData || [],
        lengthMeters: length * 1000,
      };

      const data: RouteAnalysisResponse = await analyzeRoute(requestData);
      setAnalysis(data.analysis);
      setDailyRoutes(data.dailyRoutes || []);
      setResult("Анализ завершен успешно!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка анализа";
      setResult(`Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={draggable.elementRef} className={styles.routeAnalyzer}>
      <div className={styles.header} onMouseDown={draggable.handleMouseDown}>
        <h3 className={styles.title}>🏔️ Анализ маршрута</h3>
        <div className={styles.controls}>
          <button
            className={styles.popupButton}
            onClick={() => setShowPopup(true)}
            title="Открыть в отдельном окне"
          >
            🔗
          </button>
        </div>
      </div>

      {route && (
        <div className={styles.routeData}>
          <strong>📊 Данные маршрута:</strong>
          <div>📍 Точек: {route.length}</div>
          <div>📏 Длина: {length.toFixed(2)} км</div>
          <div>📈 Набор высоты: {elevationGain} м</div>
          <div>
            🌄 Высотные данные:{" "}
            {elevationData ? elevationData.length + " точек" : "загружаются..."}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            <div>Тип туризма: {inputs.tourismType}</div>
            <div>Дата начала: {inputs.startDate}</div>
            <div>Дата окончания: {inputs.endDate}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>🚶 Тип туризма:</label>
          <select
            name="tourismType"
            value={inputs.tourismType}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="пеший">🚶 Пеший</option>
            <option value="велосипедный">🚴 Велосипедный</option>
            <option value="водный">🚣 Водный</option>
            <option value="горный">🏔️ Горный</option>
            <option value="лыжный">🎿 Лыжный</option>
            <option value="автомобильный">🚗 Автомобильный</option>
            <option value="воздушный">✈️ Воздушный</option>
            <option value="мото">🏍️ Мото</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>📅 Дата начала:</label>
          <input
            type="date"
            name="startDate"
            value={inputs.startDate}
            onChange={handleChange}
            required
            className={styles.input}
            style={{ minWidth: "150px" }}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>📅 Дата окончания:</label>
          <input
            type="date"
            name="endDate"
            value={inputs.endDate}
            onChange={handleChange}
            required
            className={styles.input}
            style={{ minWidth: "150px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !route}
          className={`${styles.submitButton} ${
            !route || loading ? styles.disabled : ""
          }`}
        >
          {loading
            ? "🧠 Анализируем..."
            : route
            ? "🚀 Проанализировать маршрут"
            : "📝 Нарисуйте маршрут"}
        </button>
      </form>

      {result && (
        <div
          className={`${styles.result} ${
            result.includes("Ошибка") ? styles.error : styles.success
          }`}
        >
          <strong>{result}</strong>
        </div>
      )}

      {analysis && (
        <div className={styles.analysis}>
          <h4 className={styles.analysisTitle}>📋 Результат анализа:</h4>
          <div className={styles.analysisContent}>{analysis}</div>
        </div>
      )}

      {dailyRoutes.length > 0 && (
        <div className={styles.dailyRoutes}>
          <h4 className={styles.dailyTitle}>📅 Разбивка по дням:</h4>
          <div className={styles.dailyList}>
            {dailyRoutes.map((day) => (
              <div key={day.day} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <h5>День {day.day}</h5>
                  <span className={styles.date}>{day.date}</span>
                </div>
                <div className={styles.dayStats}>
                  <span>📏 {day.distance} км</span>
                  <span>📈 +{day.elevationGain}м</span>
                </div>
                <div className={styles.weather}>
                  <span>🌤️ {day.weather.description}</span>
                </div>
                <div className={styles.description}>{day.description}</div>
                {day.recommendations.length > 0 && (
                  <div className={styles.recommendations}>
                    <strong>💡 Рекомендации:</strong>
                    <ul>
                      {day.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resize handles */}
      <div
        className={styles.resizeHandle}
        onMouseDown={(e) => resizable.handleMouseDown(e, "se")}
      />

      {/* Popup Modal */}
      {showPopup && (
        <div
          className={styles.popupOverlay}
          onClick={() => setShowPopup(false)}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>📋 Анализ маршрута</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.popupContent}>
              {analysis && (
                <div className={styles.analysis}>
                  <div className={styles.analysisContent}>{analysis}</div>
                </div>
              )}
              {dailyRoutes.length > 0 && (
                <div className={styles.dailyRoutes}>
                  <h4>📅 Разбивка по дням:</h4>
                  <div className={styles.dailyList}>
                    {dailyRoutes.map((day) => (
                      <div key={day.day} className={styles.dayCard}>
                        <div className={styles.dayHeader}>
                          <h5>День {day.day}</h5>
                          <span className={styles.date}>{day.date}</span>
                        </div>
                        <div className={styles.dayStats}>
                          <span>📏 {day.distance} км</span>
                          <span>📈 +{day.elevationGain}м</span>
                        </div>
                        <div className={styles.weather}>
                          <span>🌤️ {day.weather.description}</span>
                        </div>
                        <div className={styles.description}>
                          {day.description}
                        </div>
                        {day.recommendations.length > 0 && (
                          <div className={styles.recommendations}>
                            <strong>💡 Рекомендации:</strong>
                            <ul>
                              {day.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteAnalyzer;
