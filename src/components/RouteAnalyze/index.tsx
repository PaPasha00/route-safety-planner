import { useState } from "react";

interface RouteAnalyzerProps {
  route: [number, number][] | null;
  length: number;
  elevationGain: number;
  elevationData: number[] | null;
}

const RouteAnalyzer = ({
  route,
  length,
  elevationGain,
  elevationData,
}: RouteAnalyzerProps) => {
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
      const requestData = {
        lengthKm: length,
        elevationGain: inputs.elevationGain || elevationGain.toString(),
        terrain: inputs.terrain,
        coordinates: route,
        elevationData: elevationData,
        lengthMeters: length * 1000,
      };

      const response = await fetch("http://localhost:3001/api/analyze-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.analysis) {
        setAnalysis(data.analysis);
        setResult("Анализ завершен успешно!");
      } else if (data.error) {
        setResult(`Ошибка: ${data.error}`);
      }
    } catch (err) {
      setResult("Ошибка анализа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        zIndex: 1000,
        width: "400px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#2c5530" }}>🏔️ Анализ маршрута</h3>

      {route && (
        <div
          style={{
            marginBottom: "15px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
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

      <form onSubmit={handleSubmit} style={{ marginBottom: "15px" }}>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            📐 Перепад высот (м):
          </label>
          <input
            type="number"
            name="elevationGain"
            value={inputs.elevationGain || elevationGain}
            onChange={handleChange}
            required
            min="0"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            🏞️ Тип местности:
          </label>
          <select
            name="terrain"
            value={inputs.terrain}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
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
          style={{
            width: "100%",
            padding: "12px",
            background: !route ? "#ccc" : loading ? "#ff9800" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: !route || loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
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
          style={{
            marginBottom: "15px",
            padding: "10px",
            background: result.includes("Ошибка") ? "#ffebee" : "#e8f5e8",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <strong>{result}</strong>
        </div>
      )}

      {analysis && (
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            background: "#f5f5f5",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h4 style={{ marginTop: 0, color: "#2c5530" }}>
            📋 Результат анализа:
          </h4>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteAnalyzer;
