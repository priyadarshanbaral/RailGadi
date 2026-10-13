export default function Companion({ data }) {
  if (!data) return null;

  const { weather, geoFeatures, travelGuide, safety, emergency } = data;

  const WeatherCard = ({ label, w }) => (
    <div className="glass-card weather-card">
      <div className="weather-label">{label}</div>
      <div className="weather-temp">{w.temp}°C</div>
      <div className="weather-cond">{w.condition}</div>
      <div className="weather-station">{w.station}</div>
      <div className="weather-meta">
        <span>💧 {w.humidity}%</span>
        <span>🌬️ {w.wind} km/h</span>
        <span>🌧️ {w.rain}%</span>
      </div>
    </div>
  );

  const ListBlock = ({ title, icon, items }) => (
    <div className="glass-card companion-block">
      <h3 className="companion-block-title">
        {icon} {title}
      </h3>
      <div className="chip-list">
        {items.map((item, i) => (
          <span className="chip" key={i}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="companion">
      {/* Weather */}
      <h3 className="section-title">🌤️ Weather Forecast</h3>
      <div className="grid grid-3">
        <WeatherCard label="Current Station" w={weather.current} />
        <WeatherCard label="Next Station" w={weather.next} />
        <WeatherCard label="Destination" w={weather.destination} />
      </div>

      {/* Geo features */}
      <h3 className="section-title">🗺️ Nearby Natural Wonders</h3>
      <div className="grid grid-3">
        {geoFeatures.map((f, i) => (
          <div className="glass-card geo-card" key={i}>
            <div className="geo-icon">
              {f.type === "River" ? "🌊" : f.type === "Lake" ? "🏞️" : "⛰️"}
            </div>
            <div className="geo-name">{f.name}</div>
            <div className="geo-type">{f.type}</div>
          </div>
        ))}
      </div>

      {/* Travel guide */}
      <h3 className="section-title">🧳 Travel Guide</h3>
      <div className="grid grid-2">
        <ListBlock title="Tourist Attractions" icon="🏛️" items={travelGuide.attractions} />
        <ListBlock title="Local Food" icon="🍛" items={travelGuide.food} />
        <ListBlock title="Hotels & Stay" icon="🏨" items={travelGuide.hotels} />
        <ListBlock title="Medical Facilities" icon="🏥" items={travelGuide.medical} />
        <ListBlock title="ATM & Fuel" icon="🏧" items={travelGuide.atm} />
        <ListBlock title="Local Transport" icon="🚌" items={travelGuide.transport} />
      </div>

      {/* Safety */}
      <div className="grid grid-2">
        <div className="glass-card safety-card">
          <h3 className="companion-block-title">🛡️ Safety & Emergency</h3>
          <div className="emergency-grid">
            <div className="emergency-item">
              <span>Police</span>
              <strong>{emergency.police}</strong>
            </div>
            <div className="emergency-item">
              <span>Ambulance</span>
              <strong>{emergency.ambulance}</strong>
            </div>
            <div className="emergency-item">
              <span>Fire</span>
              <strong>{emergency.fire}</strong>
            </div>
            <div className="emergency-item">
              <span>Railway</span>
              <strong>{emergency.railway}</strong>
            </div>
          </div>
          <div className="helpline">
            <strong>Railway Helpline:</strong> {safety.helpline}
          </div>
        </div>

        <div className="glass-card safety-card">
          <h3 className="companion-block-title">⚠️ Safety Alerts</h3>
          <ul className="safety-list">
            {safety.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card tips-card">
        <h3 className="companion-block-title">💡 Travel Tips & Recommendations</h3>
        <div className="chip-list">
          {travelGuide.tips.map((tip, i) => (
            <span className="chip chip-accent" key={i}>
              {tip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
