import { useState } from "react";

const RouteAnalyzer = () => {
  const [inputs, setInputs] = useState({
    lengthKm: "",
    elevationGain: "",
    terrain: "горы",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/analyze-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      const data = await response.json();
      setResult(`Сложность маршрута: ${data.difficulty}`);
    } catch (err) {
      alert("Ошибка анализа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        zIndex: 1000,
        width: "300px",
      }}
    >
      <h3>Оценка сложности маршрута</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Длина (км): </label>
          <input
            type="number"
            name="lengthKm"
            value={inputs.lengthKm}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Перепад высот (м): </label>
          <input
            type="number"
            name="elevationGain"
            value={inputs.elevationGain}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Тип местности: </label>
          <select name="terrain" value={inputs.terrain} onChange={handleChange}>
            <option value="горы">Горы</option>
            <option value="лес">Лес</option>
            <option value="вода">Вода</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Анализ..." : "Оценить"}
        </button>
      </form>
      {result && (
        <p>
          <strong>{result}</strong>
        </p>
      )}
    </div>
  );
};

export default RouteAnalyzer;
