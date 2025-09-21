import React, { useState } from "react";
import {
  LatLngTuple,
  ElevationStats,
  RouteAnalysisRequest,
  RouteAnalysisResponse,
} from "../../types";
import { analyzeRoute } from "../../helpers/api";
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
    elevationGain: "",
    terrain: "горы",
  });
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
        elevationGain: inputs.elevationGain
          ? Number(inputs.elevationGain)
          : elevationGain,
        terrain: inputs.terrain,
        coordinates: route,
        elevationData: elevationData || [],
        lengthMeters: length * 1000,
      };

      const data: RouteAnalysisResponse = await analyzeRoute(requestData);
      setAnalysis(data.analysis);
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
    <div className={styles.routeAnalyzer}>
      <h3 className={styles.title}>🏔️ Анализ маршрута</h3>

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
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>📐 Перепад высот (м):</label>
          <input
            type="number"
            name="elevationGain"
            value={inputs.elevationGain || elevationGain}
            onChange={handleChange}
            required
            min="0"
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>🏞️ Тип местности:</label>
          <select
            name="terrain"
            value={inputs.terrain}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="горы">🏔️ Горы</option>
            <option value="лес">🌲 Лес</option>
            <option value="равнина">🌾 Равнина</option>
            <option value="побережье">🏖️ Побережье</option>
            <option value="город">🏙️ Город</option>
            <option value="смешанный">🔀 Смешанный</option>
          </select>
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
    </div>
  );
};

export default RouteAnalyzer;
